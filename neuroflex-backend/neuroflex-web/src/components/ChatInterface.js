// src/components/ChatInterface.js
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './ChatInterface.css';

const ChatInterface = ({ currentUserId, currentUserName, otherUserId, otherUserName, isCurrentUserTherapist, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatLoading, setChatLoading] = useState(true);
    const [chatError, setChatError] = useState(null);
    const messagesEndRef = useRef(null);

    const chatId = [currentUserId, otherUserId].sort().join('_');
    const messagesCollectionRef = collection(db, 'chats', chatId, 'messages');
    const chatDocRef = doc(db, 'chats', chatId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        setChatLoading(true);
        setChatError(null);

        const initializeChat = async () => {
            try {
                const chatSnap = await getDoc(chatDocRef);
                if (!chatSnap.exists()) {
                    const newPatientId = isCurrentUserTherapist ? otherUserId : currentUserId;
                    const newTherapistId = isCurrentUserTherapist ? currentUserId : otherUserId;

                    const chatDocData = {
                        patientId: newPatientId,
                        therapistId: newTherapistId,
                        lastMessageText: '',
                        lastMessageTimestamp: serverTimestamp(),
                        createdAt: serverTimestamp(),
                    };

                    // --- DEBUGGING LOG ---
                    console.log("Attempting to create/initialize chat document with data:", chatDocData);
                    // --- END DEBUGGING LOG ---

                    await setDoc(chatDocRef, chatDocData);
                    console.log("New chat document created:", chatId);
                }
            } catch (err) {
                console.error("Error initializing chat document:", err);
                setChatError("Failed to initialize chat. Please check your network and permissions.");
                setChatLoading(false);
                return;
            }

            const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedMessages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate()
                }));
                setMessages(fetchedMessages);
                setChatLoading(false);
            }, (err) => {
                console.error("Error fetching messages:", err);
                setChatError("Failed to load messages. Please try again.");
                setChatLoading(false);
            });

            return () => unsubscribe();
        };

        initializeChat();
    }, [chatId, currentUserId, otherUserId, isCurrentUserTherapist]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;

        try {
            const messageData = {
                senderId: currentUserId,
                senderName: currentUserName,
                text: newMessage.trim(),
                timestamp: serverTimestamp(),
            };

            await addDoc(messagesCollectionRef, messageData);

            await setDoc(chatDocRef, {
                lastMessageText: newMessage.trim(),
                lastMessageTimestamp: serverTimestamp(),
            }, { merge: true });

            setNewMessage('');
        } catch (err) {
            console.error("Error sending message:", err);
            setChatError("Failed to send message.");
        }
    };

    if (chatLoading) {
        return <div className="chat-loading">Loading chat...</div>;
    }

    if (chatError) {
        return <div className="chat-error">{chatError}</div>;
    }

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h3>Chat with {otherUserName}</h3>
                <button className="chat-close-button" onClick={onClose}>&times;</button>
            </div>
            <div className="messages-list">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`message-bubble ${msg.senderId === currentUserId ? 'sent' : 'received'}`}
                    >
                        <p className="message-text">{msg.text}</p>
                        <span className="message-timestamp">
                            {msg.timestamp ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="message-input-form">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="message-input"
                />
                <button type="submit" className="send-button">Send</button>
            </form>
        </div>
    );
};

export default ChatInterface;
