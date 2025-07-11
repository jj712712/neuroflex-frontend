# emotiv-bridge-python/emotiv_bridge.py
import asyncio
import websockets
import json
import time
import random # Used for simulating data if real Emotiv SDK integration isn't complete

# --- IMPORTANT: REPLACE WITH YOUR ACTUAL EMOTIV APP CREDENTIALS ---
# You get these from your Emotiv Developer Portal application settings.
EMOTIV_CLIENT_ID = "YOUR_EMOTIV_CLIENT_ID" # e.g., "Z1WQEONW49jQZbDkZbkeVgLDayM70MtYoEc9q396"
EMOTIV_CLIENT_SECRET = "YOUR_EMOTIV_CLIENT_SECRET" # e.g., "qj5qSGUsS46IYjGTXHr95j8fG0chx07n5O9NCTUrwL3oDiI46wvCrlGVv6ZXseKxVYbGXObHnzPfEDOziKrMiQNnZHh34ArH6PhPYmr9JwC4URgYUoBcag39mMlWpiQf"
# ------------------------------------------------------------------

# Emotiv Cortex WebSocket URL (standard local endpoint)
EMOTIV_CORTEX_WS_URL = "wss://localhost:6868"
# Port for your React app to connect to this Python bridge
REACT_APP_WEBSOCKET_PORT = 8080

class EmotivCortexClient:
    """
    Handles communication with the Emotiv Cortex API via WebSocket.
    This is a conceptual implementation. You will replace simulation parts
    with actual Emotiv SDK calls.
    """
    def __init__(self):
        self.cortex_ws = None
        self.cortex_token = None
        self.headset_id = None
        self.session_id = None
        self.message_id = 0 # For JSON-RPC requests

    async def send_cortex_request(self, method, params):
        """Sends a JSON-RPC request to the Emotiv Cortex WebSocket."""
        self.message_id += 1
        request = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": self.message_id
        }
        print(f"Sending to Cortex: {json.dumps(request)}")
        await self.cortex_ws.send(json.dumps(request))
        return self.message_id

    async def receive_cortex_response(self, expected_id=None):
        """Receives and parses a response from the Emotiv Cortex WebSocket."""
        response = json.loads(await self.cortex_ws.recv())
        print(f"Received from Cortex: {response}")
        if expected_id and response.get("id") != expected_id:
            print(f"Warning: Received unexpected response ID. Expected {expected_id}, got {response.get('id')}")
        if response.get("error"):
            raise Exception(f"Emotiv Cortex Error: {response['error'].get('message', 'Unknown error')} (Code: {response['error'].get('code')})")
        return response

    async def connect_and_stream(self, react_websocket):
        """
        Establishes connection to Emotiv Cortex, performs handshake,
        and streams relevant data to the connected React application.
        """
        try:
            # Connect to Emotiv Cortex
            self.cortex_ws = await websockets.connect(EMOTIV_CORTEX_WS_URL)
            print("Successfully connected to Emotiv Cortex WebSocket.")

            # --- Emotiv Cortex API Handshake Steps ---
            # 1. Request Access
            req_id_0 = await self.send_cortex_request("requestAccess", {"clientId": EMOTIV_CLIENT_ID, "clientSecret": EMOTIV_CLIENT_SECRET})
            response_0 = await self.receive_cortex_response(req_id_0)
            if not response_0.get("result", {}).get("accessGranted"):
                raise Exception("Access not granted by Emotiv Launcher. Please approve the app.")

            # 2. Authorize
            req_id_1 = await self.send_cortex_request("authorize", {"clientId": EMOTIV_CLIENT_ID, "clientSecret": EMOTIV_CLIENT_SECRET})
            response_1 = await self.receive_cortex_response(req_id_1)
            self.cortex_token = response_1["result"]["cortexToken"]
            print(f"Authenticated with Cortex. Token: {self.cortex_token[:10]}...") # Show partial token

            # 3. Query Headsets
            req_id_2 = await self.send_cortex_request("queryHeadsets", {})
            response_2 = await self.receive_cortex_response(req_id_2)
            if not response_2.get("result"):
                raise Exception("No headsets found. Ensure headset is on and paired with Emotiv Launcher.")
            self.headset_id = response_2["result"][0]["id"] # Take the first found headset
            print(f"Found headset: {self.headset_id}")

            # 4. Connect Device
            req_id_3 = await self.send_cortex_request("controlDevice", {"command": "connect", "headset": self.headset_id})
            response_3 = await self.receive_cortex_response(req_id_3)
            if response_3["result"]["status"] != "connected":
                raise Exception(f"Failed to connect headset: {response_3['result'].get('message', 'Unknown')}")
            print(f"Headset connected: {self.headset_id}")

            # 5. Create Session
            req_id_4 = await self.send_cortex_request("createSession", {"cortexToken": self.cortex_token, "headset": self.headset_id, "status": "active"})
            response_4 = await self.receive_cortex_response(req_id_4)
            self.session_id = response_4["result"]["id"]
            print(f"Emotiv Session created: {self.session_id}")

            # 6. Subscribe to Streams (Power bands and performance metrics)
            req_id_5 = await self.send_cortex_request("subscribe", {"cortexToken": self.cortex_token, "session": self.session_id, "streams": ["pow", "met"]})
            response_5 = await self.receive_cortex_response(req_id_5)
            print("Successfully subscribed to 'pow' and 'met' streams.")

            print("Emotiv Cortex connection fully established. Starting data stream to React app...")

            # --- Real-time Data Streaming Loop from Cortex to React App ---
            while True:
                try:
                    emotiv_data = json.loads(await self.cortex_ws.recv())
                    # Only forward 'pow' and 'met' streams to the React app
                    if emotiv_data.get("streamName") in ["pow", "met"]:
                        await react_websocket.send(json.dumps(emotiv_data))
                    elif emotiv_data.get("sid") == self.session_id and emotiv_data.get("status") == "closed":
                        print("Emotiv session closed by Cortex. Stopping stream.")
                        break # Exit loop if session is closed externally
                except websockets.exceptions.ConnectionClosedOK:
                    print("Emotiv Cortex WebSocket closed while streaming.")
                    break # Exit loop
                except Exception as e:
                    print(f"Error receiving/forwarding Emotiv data: {e}")
                    break # Exit loop on unhandled error

        except websockets.exceptions.ConnectionClosedOK:
            print("Emotiv Cortex WebSocket connection closed gracefully during handshake.")
        except Exception as e:
            print(f"Emotiv Cortex connection or handshake error: {e}")
            if react_websocket: # Close React connection if Cortex connection failed
                await react_websocket.close(code=1011, reason=f"Emotiv bridge error: {e}")
        finally:
            # Clean up Emotiv Cortex session/connection when done
            if self.session_id and self.cortex_ws:
                try:
                    print(f"Closing Emotiv session {self.session_id}...")
                    await self.send_cortex_request("updateSession", {"cortexToken": self.cortex_token, "session": self.session_id, "status": "close"})
                    await self.receive_cortex_response() # Await confirmation
                except Exception as e:
                    print(f"Error closing Emotiv session: {e}")
            if self.cortex_ws:
                await self.cortex_ws.close()
            self.cortex_ws = None
            self.cortex_token = None
            self.session_id = None
            self.headset_id = None
            print("Emotiv Cortex connection resources cleaned up.")


async def react_app_websocket_handler(react_websocket, path):
    """
    Handles incoming WebSocket connections from the React app.
    Each new React connection will attempt to establish a new Emotiv Cortex session
    and start streaming.
    """
    print(f"React app connected from {react_websocket.remote_address}")
    emotiv_client = EmotivCortexClient()
    try:
        await emotiv_client.connect_and_stream(react_websocket)
    except Exception as e:
        print(f"Error in React app WebSocket handler: {e}")
        # Send error message back to React app if possible before closing
        try:
            await react_websocket.send(json.dumps({"error": f"Bridge connection failed: {e}"}))
        except: pass # Ignore if send fails
        await react_websocket.close(code=1011, reason=str(e)) # Close with specific code
    finally:
        print(f"React app disconnected from {react_websocket.remote_address}. Bridge handler complete.")


async def start_websocket_server():
    """Starts the WebSocket server for the React application to connect to."""
    print(f"Starting React App WebSocket server on ws://localhost:{REACT_APP_WEBSOCKET_PORT}")
    # Run the server forever
    async with websockets.serve(react_app_websocket_handler, "localhost", REACT_APP_WEBSOCKET_PORT):
        await asyncio.Future()

if __name__ == "__main__":
    # It's recommended to run this script as administrator/sudo if you encounter
    # permissions issues when trying to connect to wss://localhost:6868,
    # as it might involve certificate trusts.
    asyncio.run(start_websocket_server())
