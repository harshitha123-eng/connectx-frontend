import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAllUsers,getOnlineUsers } from "../services/UserService";
import { getConversation, sendMessage,searchPrivateMessages,getGroupMessages,searchGroupMessages as serachGroupMessagesAPI } from "../services/MessagesService";
import { uploadFile } from "../services/FileService";
import { getNotifications,markAllNotificationsRead } from "../services/NotificationService";
import {
    getGroupsByUser,
    getGroupById,
    getGroupMembers,
    updateGroup,
    addMember,
    removeMember,
    leaveGroup,
    deleteGroup,
    createGroup
   
} from "../services/GroupService";
import * as WebSocketService from "../services/WebSocketService";
import {
    addReaction,
    getReactions
} from "../services/ReactionService";
import { FiPaperclip, FiLogOut, FiSend } from "react-icons/fi";
import { FiBell } from "react-icons/fi";
import { FiTrash2 } from "react-icons/fi";
 
function Home() {
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [groupInfo, setGroupInfo] = useState(null);
    const [groupMembers, setGroupMembers] = useState([]);
    const [isEditingGroup, setIsEditingGroup] = useState(false);
    const [editGroupName, setEditGroupName] = useState("");
    const [editGroupDescription, setEditGroupDescription] = useState("");
    const [showAddMember, setShowAddMember] = useState(false);
    const [showLeaveGroup, setShowLeaveGroup] = useState(false);
    const [showDeleteGroup,setShowDeleteGroup] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedMemberId, setSelectedMemberId] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [search, setSearch] = useState("");
    const [messageSearch, setMessageSearch] = useState("");
    const [typingUser, setTypingUser] = useState(null);
    const [groupTypingUser, setGroupTypingUser] = useState(null);
    const bottomRef = useRef(null);
    const selectedUserRef = useRef(null);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [reactions, setReactions] = useState({});
    const [showReactionPicker, setShowReactionPicker] = useState(null);
    const [hoveredMessage, setHoveredMessage] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const loggedInUserId = Number(localStorage.getItem("userId"));
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupDescription, setNewGroupDescription] = useState("");
    const [newGroupMembers, setNewGroupMembers] = useState([]);

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            alert("Group name is required");
            return;
        }
        try {
            await createGroup({
                name: newGroupName.trim(),
                description: newGroupDescription.trim(),
                adminId: loggedInUserId,
                memberIds: newGroupMembers
            });
            alert("Group created successfully");
            setShowCreateGroup(false);
            setNewGroupName("");
            setNewGroupDescription("");
            setNewGroupMembers([]);
            fetchGroups();
        } catch (error) {
            console.log(error);
            alert("Failed to create group");
        }
    };
   
    const unreadNotificationCount = notifications.filter(
    notification => !notification.isRead
).length;
    const navigate = useNavigate();

    const handleLogout = () => {

    WebSocketService.disconnectWebSocket();

    localStorage.removeItem("token");
    localStorage.removeItem("userId");

    navigate("/");
};

const loadReactions = async (messageId) => {

    try {

        const response = await getReactions(messageId);

        setReactions(prev => ({
            ...prev,
            [messageId]: response.data
        }));

    } catch (error) {
        console.log(error);
    }
};

const onReactionReceived = (reaction) => {

    loadReactions(reaction.messageId);

};

const handleNotification = (notification) => {

    setNotifications(prev => [
        {
            ...notification,
            isRead:false
        },
        ...prev
    ]);

    if (Notification.permission === "granted") {
        new Notification(notification.title, {
            body: notification.message
        });
    }
};

const handleDeleteMessageEvent = (data) => {

    setMessages(prevMessages => {

        const updated = prevMessages.map(msg => {

            if (msg.id === data.messageId) {
                return {
                    ...msg,
                    isDeleted: true
                };
            }

            return msg;
        });

        return updated;
    });
};

useEffect(() => {

    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }

}, []);

   useEffect(() => {

    const token = localStorage.getItem("token");

    fetchUsers();
    fetchGroups();
    
    const userId = Number(localStorage.getItem("userId"));


    WebSocketService.connectWebSocket(
        userId,

            (newMessage) => {

    const currentChat = selectedUserRef.current;

    if (
        currentChat &&
        (
            (newMessage.senderId === currentChat.id &&
             newMessage.receiverId === userId) ||

            (newMessage.senderId === userId &&
             newMessage.receiverId === currentChat.id)
        )
    ) {

         setMessages(prev => {

    if (prev.some(msg => msg.id === newMessage.id)) {
        
        return prev;
    }

    const updated = [...prev, newMessage];

    return updated;
});

    }

},
        (typingData) => {
            if (typingData.typing) {
                setTypingUser(typingData.senderId);
            } else {
                setTypingUser(null);
            }
        },
        (statusData) => {

    setOnlineUsers((prev) => {

        const updated = new Set(prev);

        const id = Number(statusData.userId);

        if (statusData.status === "ONLINE") {
            updated.add(id);
        } else {
            updated.delete(id);
        }

        return updated;
    });

    if (
        selectedUserRef.current &&
        Number(selectedUserRef.current.id) === Number(statusData.userId)
    ) {
        fetchUsers();
    }

},

       (updatedMessages) => {

    setMessages(prev => {

        const updated = prev.map(msg => {

            const latest = updatedMessages.find(m => m.id === msg.id);

            return latest ? latest : msg;
        });

        return updated;
    });

},
    
(messageId) => {

    setMessages(prev => {

        const updated = prev.map(msg =>
            msg.id === messageId
                ? { ...msg, status: "DELIVERED" }
                : msg
        );

        return updated;
    });

},
onReactionReceived,
handleNotification,
handleDeleteMessageEvent,  
() => {

    console.log("WebSocket Fully Connected");

    fetchOnlineUsers();

}

);
    return () => {
        WebSocketService.disconnectWebSocket();
    };

}, []); 


useEffect(() => {
    selectedUserRef.current = selectedUser;
}, [selectedUser]);

useEffect(() => {

    if (showGroupInfo && selectedGroup) {
        loadGroupInfo();
    }

}, [showGroupInfo]);
    
     const fetchUsers = async () => {
    try {
        const response = await getAllUsers();
        setUsers(response.data);
        if (selectedUserRef.current) {

    const latestUser = response.data.find(
        user => user.id === selectedUserRef.current.id
    );

    if (latestUser) {
        setSelectedUser(latestUser);
        selectedUserRef.current = latestUser;
    }
}
    } catch (error) {
        console.log(error);
    }
};

const fetchGroups = async () => {

    try {

        const userId = Number(localStorage.getItem("userId"));

        const response = await getGroupsByUser(userId);

        setGroups(response);

    } catch (error) {

        console.log(error);

    }

};

   const fetchOnlineUsers = async () => {
    try {
        const response = await getOnlineUsers();

        setOnlineUsers(new Set(response.data.map(id => Number(id))));
    } catch (err) {
        console.log(err);
    }
};

const fetchConversation = async (receiverId) => {
        try {
             const senderId = Number(localStorage.getItem("userId"));

        const response = await getConversation(senderId, receiverId);

        setMessages(response.data);

        response.data.forEach(msg => {
        loadReactions(msg.id);
        });
        WebSocketService.sendReadReceipt({
            senderId: receiverId,
            receiverId: senderId
        });
            
        } catch (error) {
            console.log(error);
        }
    };

    const fetchGroupMessages = async (groupId) => {

    try {
        const response = await getGroupMessages(groupId);

        setMessages(response.data);

        response.data.forEach(msg => {
            loadReactions(msg.id);
        });

    } catch (error) {
        console.log(error);
    }

};
    
const searchMessages = async (keyword) => {

    if (!selectedUser) return;

    const senderId = Number(localStorage.getItem("userId"));

    if (keyword.trim() === "") {
        fetchConversation(selectedUser.id);
        return;
    }

    try {
        const response = await searchPrivateMessages(
            senderId,
            selectedUser.id,
            keyword
        );

        setMessages(response.data);

    } catch (error) {
        console.log(error);
    }
};

const searchGroupMessages = async (keyword) => {

    try {

        const response = await serachGroupMessagesAPI(
            selectedGroup.id,
            keyword
        );

        setMessages(response.data);

    } catch (e) {
        console.log("ERROR");
        console.log(e);
    }
};

const handleUpdateGroup = async () => {

    try {

        const request = {
            name: editGroupName,
            description: editGroupDescription,
            groupPicture: groupInfo.groupPicture,
            adminId: Number(localStorage.getItem("userId"))
        };

        await updateGroup(selectedGroup.id, request);

        alert("Group updated successfully");

        setIsEditingGroup(false);

        loadGroupInfo();

        fetchGroups();

    } catch (error) {

        console.log(error);

        alert("Failed to update group");

    }
};

const handleAddMember = async () => {

    if (!selectedMemberId) {
        alert("Please select a user");
        return;
    }

    try {

        const adminId = Number(localStorage.getItem("userId"));

        await addMember(
            selectedGroup.id,
            Number(selectedMemberId),
            adminId
        );

        alert("Member added successfully");

        setShowAddMember(false);

        loadGroupInfo();

        fetchGroups();

    } catch (error) {

        console.log(error);

        alert("Failed to add member");

    }

};

const handleRemoveMember = async (userId) => {

    try {

        await removeMember(
            selectedGroup.id,
            userId,
            loggedInUserId
        );

        alert("Member removed successfully");

        const members = await getGroupMembers(selectedGroup.id);

        setGroupMembers(members);

    } catch (error) {

        console.log(error);

        alert("Failed to remove member");

    }

};

const handleLeaveGroup = async () => {

    try {

        if (!window.confirm("Are you sure you want to leave this group?")) {
            return;
        }

        await leaveGroup(
            selectedGroup.id,
            loggedInUserId
        );

        alert("You left the group successfully");

        setShowGroupInfo(false);
        setSelectedGroup(null);
        setMessages([]);

        fetchGroups();

    } catch (error) {

        console.log(error);

        alert("Failed to leave group");

    }

};

const handleDeleteGroup = async () => {

    if (!selectedGroup) return;


    const confirmDelete = window.confirm(
        "Are you sure you want to delete this group?"
    );


    if (!confirmDelete) {
        return;
    }


    try {

        await deleteGroup(
            selectedGroup.id,
            loggedInUserId
        );

        setGroups(prevGroups =>
            prevGroups.filter(
                group => group.id !== selectedGroup.id
            )
        );

        setShowGroupInfo(false);
        setSelectedGroup(null);

        alert("Group deleted successfully");

    } catch (error) {

        console.error(
            "Delete group error:",
            error
        );


        alert(
            error.response?.data ||
            "Failed to delete group"
        );
    }
};

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [selectedUser, selectedGroup, messages]);

    const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
};


   const handleReaction = async (messageId, reaction) => {

    try {

        const request = {
            messageId,
            userId: loggedInUserId,
            reaction
        };

        await addReaction(request);

        loadReactions(messageId);

    } catch (error) {
        console.log(error);
    }
};

const loadGroupInfo = async () => {

    try {

        const group = await getGroupById(selectedGroup.id);
        const members = await getGroupMembers(selectedGroup.id);

        setGroupInfo(group);
        setGroupMembers(members);

    } catch (error) {
        console.log(error);
    }

};

const openAddMemberPopup = () => {

    const memberIds = groupMembers.map(member => member.id);

    const remainingUsers = users.filter(
        user => !memberIds.includes(user.id)
    );

    setAvailableUsers(remainingUsers);

    setSelectedMemberId("");

    setShowAddMember(true);

};
   const handleSendMessage = async () => {

    if (!message.trim() && !selectedFile) return;

    try {

        const senderId = Number(localStorage.getItem("userId"));

        let fileUrl = null;
        let fileName = null;
        let type = "TEXT";

        if (selectedFile) {

            fileUrl = await uploadFile(
                selectedFile,
                localStorage.getItem("token")
            );

            fileName = selectedFile.name;

            if (selectedFile.type.startsWith("image/")) {
                type = "IMAGE";
            } else if (selectedFile.type.startsWith("video/")) {
                type = "VIDEO";
            } 
            else if (selectedFile.type === "application/pdf") {
               type = "FILE";
            }
            else {
                type = "FILE";
            }
        }

        if (selectedGroup) {

    WebSocketService.sendGroupMessage({

        senderId,

        groupId: selectedGroup.id,

        content: message,

        type,

        fileUrl,

        fileName

    });

}
else {

    WebSocketService.sendPrivateMessage({

        senderId,

        receiverId: selectedUser.id,

        content: message,

        type,

        fileUrl,

        fileName

    });

}

        if (selectedUser) {

    WebSocketService.sendTyping({
        senderId,
        receiverId: selectedUser.id,
        typing: false
    });

}

        setMessage("");
        setSelectedFile(null);

    } catch (error) {
        console.log(error);
        alert("Failed to send message");
    }
};

const formatLastSeen = (lastSeen) => {

    if (!lastSeen) return "Offline";

    const date = new Date(lastSeen);
    const now = new Date();

    const today = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const messageDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

    const time = date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    });

    if (messageDate.getTime() === today.getTime()) {
        return `last seen today at ${time}`;
    }

    if (messageDate.getTime() === yesterday.getTime()) {
        return `last seen yesterday at ${time}`;
    }

    return `last seen on ${date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long"
    })} at ${time}`;
};
      
    return (
        <div style={styles.container}>
            {/* Sidebar */}
            <div style={styles.sidebar}>
                <div
    style={{
        display:"flex",
        justifyContent:"space-between",
        borderRight:"1px solid #ddd",
        alignItems:"center",
        marginBottom:"5px",
        position:"relative",     
    }}
>

    <h2 style={{margin:0,fontSize:"22px",fontWeight:"600",color:"#111"}}>
        ConnectX
    </h2>


    <div
  onClick={async () => {

    if (!showNotifications) {

        setShowNotifications(true);

    } else {

        const userId = Number(localStorage.getItem("userId"));

        await markAllNotificationsRead(userId);

        setNotifications(prev =>
            prev.map(notification => ({
                ...notification,
                isRead: true
            }))
        );

        setShowNotifications(false);
    }

}}
        style={{
            position:"relative",
            cursor:"pointer",
            fontSize:"22px",
            color:"#54656f"
            
        }}
    >

       <FiBell size={22} />


        {unreadNotificationCount > 0 && (

            <span
                style={{
                    position:"absolute",
                    top:"-8px",
                    right:"-8px",
                    background:"red",
                    color:"white",
                    borderRadius:"50%",
                    width:"20px",
                    height:"20px",
                    display:"flex",
                    justifyContent:"center",
                    alignItems:"center",
                    fontSize:"12px"
                }}
            >
                {unreadNotificationCount}
            </span>

        )}

    </div>
   {showNotifications && (
    <div
        style={{
            position: "absolute",
            top: "45px",
            right: "0",
            width: "320px",
            maxHeight: "350px",
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #e9edef",
            borderRadius: "12px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
            zIndex: 9999
        }}
    >
        {notifications.filter(n => !n.isRead).length === 0 ? (

            <div
                style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#777"
                }}
            >
                No Notifications
            </div>

        ) : (

            notifications.filter(notification => !notification.isRead).map(notification => (

                <div
                    key={notification.id}
                    style={{
                        padding: "12px",
                        borderBottom: "1px solid #eee",
                        cursor:"pointer",
                        background:"#fff"
                    }}
                >
                    <div style={{fontWeight:"bold"}}>
                        {notification.title}
                    </div>

                    <div style={{ marginTop: "4px" }}>
                        {notification.message}
                    </div>

                    <small style={{ color: "#888" }}>
                        {new Date(notification.createdAt)
                            .toLocaleString()}
                    </small>

                </div>

            ))

        )}

    </div>
)}
    </div>
                <button
    onClick={() => setShowCreateGroup(true)}
    style={{
        width: "100%",
        padding: "10px",
        marginTop: "8px",
        border: "none",
        borderRadius: "8px",
        background: "#128C7E",
        color: "#fff",
        cursor: "pointer",
        fontSize: "14px"
    }}
>
    + New group
</button>

{showCreateGroup && (
    <div style={styles.popupOverlay}>
        <div style={styles.popup}>
            <button
                onClick={() => setShowCreateGroup(false)}
                style={styles.closeButton}
            >
                ✖
            </button>
            <h2>New Group</h2>
            <input
                type="text"
                placeholder="Group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                style={styles.popupInput}
            />
            <textarea
                placeholder="Description (optional)"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                style={styles.popupTextarea}
            />
            <div style={{ maxHeight: "180px", overflowY: "auto", margin: "10px 0" }}>
                {users.map((user) => (
                    <label key={user.id} style={{ display: "block", padding: "4px 0" }}>
                        <input
                            type="checkbox"
                            checked={newGroupMembers.includes(user.id)}
                            onChange={(e) =>
                                setNewGroupMembers((prev) =>
                                    e.target.checked
                                        ? [...prev, user.id]
                                        : prev.filter((id) => id !== user.id)
                                )
                            }
                        />{" "}
                        {user.fullName}
                    </label>
                ))}
            </div>
            <div style={styles.popupButtonContainer}>
                <button
                    style={styles.cancelButton}
                    onClick={() => setShowCreateGroup(false)}
                >
                    Cancel
                </button>
                <button style={styles.saveButton} onClick={handleCreateGroup}>
                    Create
                </button>
            </div>
        </div>
    </div>
)}

       <input
                    type="text"
                    placeholder="🔍 Search users or groups..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "10px 18px",
                        borderRadius: "8px",
                        border: "none",
                        background:"#f0f2f5",
                        outline:"none",
                        fontSize:"14px",
                        margin: "12px 0"
                        
                    }}
                />
                        {groups?.map((group) => {
                         console.log("Rendering Group:", group);
                         return (
                        <div
                                 key={group.id}
                      onClick={() => {
                                setSelectedUser(null);
                                setSelectedGroup(group);
                                setMessages([]);
                                setShowGroupInfo(true);
                                fetchGroupMessages(group.id);

                                WebSocketService.subscribeToGroup(
                               group.id,
                               (newMessage) => {

                                setMessages(prev => {

                                    if (prev.some(msg => msg.id === newMessage.id)) {
                                      return prev;
                                   }

                                    return [...prev, newMessage];
                            });

                           },
                           handleDeleteMessageEvent,
                       
                         (typingData) => {
                           setGroupTypingUser(typingData.senderName);
                          setTimeout(() => {
                          setGroupTypingUser(null);
                         }, 2000);
                       }
                    );
                 }}           
                                  style={{
                                      ...styles.userCard,
                                         backgroundColor:
                                         selectedGroup?.id === group.id
                                         ? "#d9fdd3"
                                         : "#ffffff",
                                         borderRadius:"0px"
                                        }}
                           >

                                  <div
                                         style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "12px"
                                                 }}
                                            >

                                          <div
                                                style={{
                                                 width: "49px",
                                                 height: "49px",
                                                 borderRadius: "50%",
                                                 backgroundColor: "#075E54",
                                                 color: "#fff",
                                                 display: "flex",
                                                 justifyContent: "center",
                                                 alignItems: "center",
                                                 fontWeight: "bold",
                                                 fontSize: "20px"
                                              }}
                                           >
                                                  👥
                                        </div>

                                    <div>

                                 <div
                                     style={{
                                     fontWeight: "bold"
                                  }}
                               >
                                    {group.name}
                                </div>

                                      <small
                                       style={{
                                       color: "gray"
                                         }}
                                    >
                                         {group.memberCount} members
                                      </small>

                                        </div>

                                </div>

                             </div>
                        );
                    })}


                {users
                    .filter((user) => user && user.fullName && user.username)
                    .filter(
                        (user) =>
                            user.fullName.toLowerCase().includes(search.toLowerCase()) ||
                            user.username.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((user) => {
                        const isOnline =
                                        onlineUsers.has(Number(user.id));
                                  
                        return (
                            <div
                                key={user.id}
                                onClick={() => {
                                    selectedUserRef.current = user;
                                    setMessages([]);
                                    setSelectedUser(user);
                                    setSelectedGroup(null);
                                    fetchConversation(user.id);
                                }}
                                style={{
                                    ...styles.userCard,
                                    background:
                                        selectedUser?.id === user.id ? "#d9fdd3" : "#fff",
                                        borderRadius:"0px",
                                        borderBottom:"1px solid #ececec",
                                        cursor:"pointer"
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px"
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "49px",
                                            height: "49px",
                                            borderRadius: "50%",
                                            backgroundColor: "#128C7E",
                                            color: "#fff",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: "600",
                                            fontSize: "20px",
                                            flexShrink:"0"
                                        }}
                                    >
                                        {user.fullName.charAt(0).toUpperCase()}
                                    </div>

                                    <div>
                                        <div
                                         style={{
                                         flex: 1,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center"
                                       }}
                                   >
                                    <div>
                                <div
                                   style={{
                                   fontWeight: "500",
                                   fontSize: "16px",
                                   color: "#111"
                              }}
                           >
                            {user.fullName}
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        </div>
        );
    })}
</div>
            {/* Chat Area */}
            <div style={styles.chatArea}>
                {(selectedUser  || selectedGroup) ? (
                    <>
                        {/* Chat Header */}
            <div
                 style={{
                 background: "#ffffff",
                 padding: "10px 16px",
                 borderRadius: "0",
                 display: "flex",
                 justifyContent: "space-between",
                 alignItems: "center",
                 marginBottom: "7px",
                 borderBottom:"1px solid #e9edef",
                 boxShadow:"0 1px 2px rgba(0,0,0,0.8)"
               }}
           >

                <div style={{ display: "flex", alignItems: "center", gap: "15px" }} >

            <div
                style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                backgroundColor: selectedGroup ? "#075E54" : "#128C7E",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "20px"
            }}
        >
            {selectedGroup
                ? "👥"
                : selectedUser?.fullName?.charAt(0).toUpperCase()}
            </div>

            <div>
               
                {selectedGroup ?  (

                <>
                    <h2
                        style={{
                        margin: 0,
                        cursor: "pointer",
                        
                     }}
                    onClick={() => setShowGroupInfo(true)}  

                   >
                        {selectedGroup?.name}
                    </h2>

                    {groupTypingUser ? (

                        <div
                             style={{
                             color: "#128C7E",
                             fontSize: "13px",
                             fontStyle: "italic"
                             }}
                           >
                                 {groupTypingUser} is typing...
                                </div>
                        ) : (
                                <small style={{ color: "gray" }}>
                                 {selectedGroup?.memberCount} members
                                 </small>
                              )}
                        </>
               ) : (

                <>
                    <h2 style={{ margin: 0,fontSize:"17px",fontWeight:"600",color:"#111" }}>
                        {selectedUser?.fullName}
                    </h2>

                   <small
                        style={{
                        color: onlineUsers.has(Number(selectedUser?.id))
                        ? "#25D366"
                        : "#667781",
                        fontSize: "16px"
              }}
           >
                {selectedUser && onlineUsers.has(Number(selectedUser.id))
                 ? "online"
                 : ` ${formatLastSeen(selectedUser?.lastSeen)}`}
                 </small>

                    { !selectedGroup && typingUser === selectedUser?.id && (
                        <div
                            style={{
                                color: "#25D366",
                                fontSize: "13px",
                                marginTop: "2px"
                            }}
                        >
                            Typing...
                        </div>
                    )}

                </>

            )}

        </div>

    </div>

    <button
        onClick={handleLogout}
        style={{
            background: "transparent",
            border: "none",
            fontSize:"22px",
            color:"#54656f",
            cursor: "pointer",
        }}
        title="LogOut"
    >
    <FiLogOut size={22} />
</button>
</div>
                                            
              {/*  Message Search */}
                    <div
                         style={{
                         background: "#f0f2f5",
                         padding: "8px 16px",
                         borderRadius: "8px",
                         borderBottom:"1px solid #e9edef ",
                         marginBottom: "0"
                        }}
                    >
                    <input
                         type="text"
                         placeholder="🔍 Search messages..."
                         value={messageSearch}
                         onChange={(e) => {
                         const keyword = e.target.value;
                         setMessageSearch(keyword);
                        if (selectedGroup) {
                               searchGroupMessages(keyword);
                             } else if (selectedUser) {
                                searchMessages(keyword);
                            }
                        }}
                           style={{
                                      width:"100%",
                                      height:"36px",
                                      padding: "0 15px",
                                      borderRadius: "0",
                                      boxSizing:"border-box",
                                      border: "none",
                                      background:"#fff",
                                      outline: "none",
                                      fontSize:"14px"
                                }}
                          />
                            </div>

                        {/* Messages */}
                        <div style={styles.messages}>
                            {messages.length === 0 ? (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        height: "100%",
                                        color: "#777",
                                        fontSize: "18px"
                                    }}
                                >
                                    NO messages yet
                                </div>
                            ) : (
                                
                                messages.map((msg) => {
                                    const isMine = msg.senderId === loggedInUserId;
                                    const showSenderName =
                                    selectedGroup && !isMine; 
                                    return (
                                        <div
                                             key={msg.id}
                                             onMouseEnter={() => setHoveredMessage(msg.id)}
                                             onMouseLeave={() => setHoveredMessage(null)}
                                             style={{
                                             display: "flex",
                                             justifyContent: isMine ? "flex-end" : "flex-start",
                                             marginBottom:
                                             reactions[msg.id]?.length > 0
                                           ? "26px"
                                             : "12px"
                                          }}
                                       >
                                            <div
                                                style={{
                                                    position:"relative",
                                                    backgroundColor: isMine ? "#d9fdd3" : "#FFFFFF",
                                                    padding: "7px 10px",
                                                    borderRadius: "8px",
                                                    maxWidth: "55%",
                                                    wordBreak: "break-word",
                                                    boxShadow: "0 1px 1px rgba(0,0,0,0.15)"
                                                    
                                                }}
                                            >
                                                {/* DELETE BUTTON */}
                                                  {isMine && !msg.isDeleted && hoveredMessage === msg.id && (
                                                        <span
                                                        onClick={() => {
                                                        if (window.confirm("Delete this message?")) {
                                                        WebSocketService.sendDeleteMessage(msg.id);
                                                         }
                                                       }}
                                                           style={{
                                                                    position: "absolute",
                                                                    top: "8px",
                                                                    right: "8px",
                                                                    cursor: "pointer",
                                                                    color: "#666"
                                                                }}
                                                              title="Delete message"
                                                           >
                                                            <FiTrash2 size={16} />
                                                        </span>
                                                             )}
                                                             {showSenderName && (
                                                                <div
                                                                  style={{
                                                                  fontWeight: "600",
                                                                  color: "#1976d2",
                                                                  marginBottom: "6px",
                                                                  fontSize: "12px"
                                                                }}
                                                                 >
                                                                    {msg.senderUsername}
                                                                </div>
                                                              )}
                                                               {msg.isDeleted ? (
                                                                <i
                                                                style={{
                                                                     color:"#777",
                                                                     fontStyle:"italic"
                                                                    }}
                                                                    >
                                                                         <i
                                                                             style={{
                                                                             color: "#667781",
                                                                            fontStyle: "italic"
                                                                            }}
                                                                         >
                                                                        🚫 This message was deleted
                                                                        </i>
                                                                         </i>
                                                                         ) : (
                                                                             <>
                                                                             {msg.type === "TEXT" && msg.content}
                                                                             {msg.type === "IMAGE" && (
                                                                                  <img
                                                                                     src={msg.fileUrl}
                                                                                      alt={msg.fileName}
                                                                                      style={{
                                                                                               width:"220px",
                                                                                               borderRadius:"8px",
                                                                                                display:"block"
                                                                                            }}
                                                                                            />
                                                                                             )}
                                                                                        {msg.type === "VIDEO" && (
                                                                                            <video
                                                                                             controls
                                                                                             width="220" style={{borderRadius:"8px"}}
                                                                                             src={msg.fileUrl}
                                                                                             />
                                                                                              )}
                                                                                              {msg.type === "FILE" && (
                                                                                                 <div>
                                                                                                    📄
                                                                                                     <a
                                                                                                      href={msg.fileUrl}
                                                                                                      target="_blank"
                                                                                                      rel="noreferrer"
                                                                                                      style={{
                                                                                                         marginLeft:"5px",
                                                                                                         color:"#1976d2",
                                                                                                         textDecoration:"none",
                                                                                                         fontWeight:"500"
                                                                                                         }}
                                                                                                          >
                                                                                                              {msg.fileName}
                                                                                                        </a>
                                                                                                    </div>
                                                                                                  )}
                                                                                                   </>
                                                                                                )}
                                                                                            {!msg.isDeleted && (
                                                                                                <div
                                                                                                 style={{
       
                                                                                                    marginTop: "8px",
                                                                                                    position: "relative",
                                                                                                    display: "flex",
                                                                                                     justifyContent: "flex-end"
                                                                                                      }}
                                                                                                      >
                                                                                                <span
                                                                                                onClick={() =>
                                                                                                     setShowReactionPicker(
                                                                                                     showReactionPicker === msg.id ? null : msg.id
                                                                                                     )
                                                                                                     }
                                                                                                      style={{
                                                                                                         cursor: "pointer",
                                                                                                         fontSize: "14px",
                                                                                                         color: "#777",
                                                                                                         visibility:
                                                                                                         hoveredMessage === msg.id ? "visible" : "hidden"
                                                                                                          }}
                                                                                                           >
                                                                                                            😊
                                                                                                 </span>
                                                                                                  {showReactionPicker === msg.id && (
                                                                                                    <div
                                                                                                    style={{
                                                                                                             position: "absolute",
                                                                                                             bottom: "28px",
                                                                                                             right: isMine?"0":"auto",
                                                                                                             left:isMine?"auto":"0",
                                                                                                             background: "#fff",
                                                                                                             borderRadius: "25px",
                                                                                                             padding: "8px 12px",
                                                                                                             display: "flex",
                                                                                                             gap: "10px",
                                                                                                             boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
                                                                                                             zIndex: 1000
                                                                                                            }}
                                                                                                            >
                                                                                                                 <span style={{cursor:"pointer"}} onClick={() => {handleReaction(msg.id,"LIKE"); setShowReactionPicker(null);}}>👍</span>
                                                                                                                 <span style={{cursor:"pointer"}} onClick={() => {handleReaction(msg.id,"LOVE"); setShowReactionPicker(null);}}>❤️</span>
                                                                                                                 <span style={{cursor:"pointer"}} onClick={() => {handleReaction(msg.id,"LAUGH"); setShowReactionPicker(null);}}>😂</span>
                                                                                                                 <span style={{cursor:"pointer"}} onClick={() => {handleReaction(msg.id,"WOW"); setShowReactionPicker(null);}}>😮</span>
                                                                                                                 <span style={{cursor:"pointer"}} onClick={() => {handleReaction(msg.id,"SAD"); setShowReactionPicker(null);}}>😢</span>
                                                                                                                 <span style={{cursor:"pointer"}} onClick={() => {handleReaction(msg.id,"ANGRY"); setShowReactionPicker(null);}}>😡</span>
                                                                                                        </div>
                                                                                                    )}
                                                                                                    </div>
                                                                                                )}
                                                                                                { !msg.isDeleted && reactions[msg.id] && reactions[msg.id].length > 0 && (
                                                                                                     <div
                                                                                                     style={{
                                                                                                         position: "absolute",
                                                                                                         bottom: "-12px",
                                                                                                         right: isMine ? "10px" : "auto",
                                                                                                         left: isMine ? "auto" : "10px",
                                                                                                         background: "#fff",
                                                                                                         borderRadius: "14px",
                                                                                                         padding: "1px 6px",
                                                                                                         display: "flex",
                                                                                                         gap: "4px",
                                                                                                         boxShadow: "0 1px 5px rgba(0,0,0,0.2)",
                                                                                                         zIndex: 5
                                                                                                        }}
                                                                                                        >
                                                                                                             {reactions[msg.id].map((reaction) => (
                                                                                                                <span
                                                                                                                 key={reaction.id}
                                                                                                                  style={{
                                                                                                                     fontSize: "16px"
                                                                                                                    }}
                                                                                                                     >
                                                                                                                         {reaction.reaction === "LIKE" && "👍"}
                                                                                                                         {reaction.reaction === "LOVE" && "❤️"}
                                                                                                                         {reaction.reaction === "LAUGH" && "😂"}
                                                                                                                         {reaction.reaction === "WOW" && "😮"}
                                                                                                                         {reaction.reaction === "SAD" && "😢"}
                                                                                                                          {reaction.reaction === "ANGRY" && "😡"}
                                                                                                                </span>
                                                                                                            ))}
                                                                                                            </div>
                                                                                                        )}
                                                                                                        <div
                                                                                                          style={{
                                                                                                             textAlign: "right",
                                                                                                              fontSize: "11px",
                                                                                                               color: "#667781",
                                                                                                                 marginTop: "4px"
                                                                                                                }}
                                                                                                                 >
                                                                                                                     {new Date(msg.sentAt).toLocaleTimeString([], {  hour: "2-digit",
                                                                                                                     minute: "2-digit"
                                                                                                             })}
                                                                                                              {isMine && !selectedGroup && !msg.isDeleted &&(
                                                                                                                  <span style={{ marginLeft: "5px",
                                                                                                                     color:msg.status==="READ"?"#53bdeb":"#667781"
                                                                                                                      }}>
                                                                                                                        {msg.status === "SENT" && "✓"}
                                                                                                                        {msg.status === "DELIVERED" && "✓✓"}
                                                                                                                         {msg.status === "READ" && "✓✓ "}
                                                                                                                          </span>
                                                                                                                         )}
                                                                                                         </div>
                                                                                                 </div>
                                                                                         </div>
                                                                                    );
                                                                                })
                                                                            )}
                                                                            <div ref={bottomRef}></div>
                                                                 </div>
                            {/* Message Input */}
                               <div style={styles.inputArea}>
                               <label
                               style={{
                              cursor: "pointer",
                              color: "#54656f",
                              display: "flex",
                              alignItems: "center"
                             }}
                            >
                            <FiPaperclip size={22} />

                            <input
                            type="file"
                            hidden
                            onChange={handleFileSelect}
                           />
                       </label>                        

                        <input
                             type="text"
                             placeholder={
                             selectedGroup
                             ? "Type a group message..."
                             : "Type a message..."
                             }
                         value={selectedFile ? selectedFile.name : message}
                        onChange={(e) => {
                        if (selectedFile) return;
                        setMessage(e.target.value);

                         // Private Chat Typing
                       if (selectedUser) {

                              WebSocketService.sendTyping({
                              senderId: loggedInUserId,
                              receiverId: selectedUser.id,
                              typing: true
                         });
                     setTimeout(() => {
                     WebSocketService.sendTyping({
                     senderId: loggedInUserId,
                     receiverId: selectedUser.id,
                     typing: false
            });

        }, 1000);
    }

    // Group Typing
    if (selectedGroup) {

        WebSocketService.sendGroupTyping({

            senderId: loggedInUserId,
            senderName: localStorage.getItem("username"),
            groupId: selectedGroup.id,
            typing: true

        });

    }

}}                       
             onKeyDown={(e) => {
                if (e.key === "Enter") {
                         handleSendMessage();
                    }
                }}
                    style={styles.input}
                />
                        <button style={styles.sendButton} onClick={handleSendMessage}>
                                ➤
                            </button>
                        </div>
                    </>
               
           ) : (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            flex: 1,
                            flexDirection: "column"
                        }}
                    >
                        <div style={{ textAlign: "center", color: "#667781" }}>
                            <h2
                            style={{
                            fontWeight: "300",
                            fontSize: "32px",
                            marginBottom: "10px"
                       }}
                   >
                         ConnectX
                        </h2>
                    <p>
                          Send and receive messages without keeping your phone online.
                    </p>
                    <p style={{ marginTop: "25px", fontSize: "13px" }}>
                         🔒 End-to-end encrypted
                         </p>
                         </div>
                    </div>
                )}   
            </div>
                 {showGroupInfo && (
                     <div style={styles.popupOverlay}>
                        <div style={styles.popup}>
                             <button
                             onClick={() => {
                                setShowGroupInfo(false);
                                setIsEditingGroup(false);
                            }}
                            style={styles.closeButton}
                             >
                                    ✖
                                     </button>
                                      {isEditingGroup ? (
                                        <>
                                          <h2>Edit Group</h2>
                                           <input
                                             type="text"
                                             value={editGroupName}
                                             onChange={(e) =>
                                                 setEditGroupName(e.target.value)
                                                }
                        style={styles.popupInput}
                    />

                    <textarea
                        value={editGroupDescription}
                        onChange={(e) =>
                            setEditGroupDescription(e.target.value)
                        }
                        style={styles.popupTextarea}
                    />

                    <div style={styles.popupButtonContainer}>

                        <button
                            style={styles.cancelButton}
                            onClick={() =>
                                setIsEditingGroup(false)
                            }
                        >
                            Cancel
                        </button>

                        <button
                            style={styles.saveButton}
                            onClick={handleUpdateGroup}
                        >
                            Save
                        </button>

                    </div>

                </>

            ) : (

                <>
                    <h2>{groupInfo?.name}</h2>

                    <p >{groupInfo?.description}</p>

                    <hr />

                    <h3>Members ({groupMembers.length})</h3>

                   {groupMembers.map(member => (

    <div
        key={member.id}
        style={styles.memberCard}
    >

        <div>

            <div>{member.fullName}</div>

            {member.id === groupInfo?.adminId && (

                <span style={styles.adminBadge}>
                    Admin
                </span>

            )}

        </div>

        {groupInfo?.adminId === loggedInUserId &&
            member.id !== groupInfo.adminId && (

            <button
                style={styles.removeButton}
                onClick={() => {

                    if (window.confirm("Remove this member?")) {

                        handleRemoveMember(member.id);

                    }

                }}
            >
                ❌ Remove
            </button>

        )}

    </div>

))}
        {groupInfo?.adminId === loggedInUserId ? (

    <>
        <button
            style={styles.addButton}
            onClick={openAddMemberPopup}
        >
            ➕ Add Member
        </button>

        <button
            style={styles.editButton}
            onClick={() => {
                setEditGroupName(groupInfo.name);
                setEditGroupDescription(groupInfo.description);
                setIsEditingGroup(true);
            }}
        >
            ✏ Edit Group
        </button>

        <button
            style={styles.deleteButton}
            onClick={handleDeleteGroup}
        >
            🗑 Delete Group
        </button>
    </>

) : (

    <button
        style={styles.leaveButton}
        onClick={() => setShowLeaveGroup(true)}
    >
        🚪 Leave Group
    </button>

    )}   

    </>
       )}
        </div>
  </div>
            
)}
           
{showAddMember && (
    <div style={styles.popupOverlay}>
        <div style={styles.popup}>

            <button
                style={styles.closeButton}
                onClick={() => setShowAddMember(false)}
            >
                ✖
            </button>

            <h2>Add Member</h2>

            <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                style={styles.popupInput}
            >
                <option value="">Select User</option>

                {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                        {user.fullName}
                    </option>
                ))}
            </select>

            <button
                style={styles.saveButton}
                onClick={() => handleAddMember(Number(selectedMemberId))}
            >
                Add
            </button>

        </div>
    </div>
)}

{showLeaveGroup && (
    <div style={styles.popupOverlay}>
        <div style={styles.popup}>

            <button
                style={styles.closeButton}
                onClick={() => setShowLeaveGroup(false)}
            >
                ✖
            </button>

            <h2>Leave Group</h2>

            <p>
                Are you sure you want to leave
                <b> {groupInfo?.name}</b>?
            </p>

            <div style={styles.popupButtonContainer}>

                <button
                    style={styles.cancelButton}
                    onClick={() => setShowLeaveGroup(false)}
                >
                    Cancel
                </button>
                <button
                    style={styles.removeButton}
                    onClick={handleLeaveGroup}
                >
                    Leave Group
                </button>

            </div>

        </div>
    </div>
)}

        </div>
        
    );
}
                
          
const styles = {
    container: {
        display: "flex",
        height: "100vh",
        backgroundColor: "#ece5dd"
    },
    sidebar: {
        width: "28%",
        backgroundColor: "#ffffff",
        borderRight: "1px solid #ddd",
        display: "flex",
        flexDirection: "column",
        padding: "15px",
        overflowY: "auto"
    },
    chatArea: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#e5ddd5",
        padding: "15px"
    },
    userCard: {
        margin:4,
        width:"100%",
        padding: "15px",
        marginBottom: "12px",
        borderRadius: "12px",
        boxSizing:"borderbox",
        cursor: "pointer",
        transition: "all 0.3s ease",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
    },
    messages: {
        flex: 1,
        overflowY: "auto",
        backgroundColor: "#efeae2",
        borderRadius: "10px",
        padding: "25px 35px",
        marginBottom: "15px"
    },
    inputArea: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "#f0f2f5",
        padding: "10px 15px",
       borderRadius: "28px",
       borderTOP:"1px solid #e9edef"
    },
    input: {
        flex: 1,
        height:"42px",
        border: "none",
        outline: "none",
        fontSize: "15px",
        padding: "0px 18px",
        borderRadius: "22px",
        background: "#fff"
    },
    sendButton: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    border: "none",
    background: "#00a884",
    color: "#fff",
    cursor: "pointer",
    fontSize: "18px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
},

popupOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
},

popup: {
    width: "450px",
    background: "#ffffff",
    color: "#000000",
    borderRadius: "12px",
    padding: "25px",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
    position: "relative"
},

closeButton: {
    position: "absolute",
    top: "15px",
    right: "15px",
    border: "none",
    background: "transparent",
    fontSize: "20px",
    cursor: "pointer"
},

popupInput: {
    width: "100%",
    padding: "12px",
    marginTop: "15px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "15px"
},

popupTextarea: {
    width: "100%",
    height: "120px",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    resize: "none",
    fontSize: "15px"
},

popupButtonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "20px"
},

saveButton: {
    background: "#128C7E",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer"
},

cancelButton: {
    background: "#ddd",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer"
},

editButton: {
    width: "100%",
    padding: "12px",
    background: "#128C7E",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold"
},

memberCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "11px 0",
    borderBottom: "1px solid #eee",
   
    
},

adminBadge: {
    background: "#128C7E",
    color: "#fff",
    padding: "3px 10px",
    borderRadius: "12px",
    fontSize: "12px"
},
addButton: {
    width: "100%",
    marginTop: "15px",
    marginBottom: "10px",
    padding: "12px",
    background: "#1976D2",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold"
},

removeButton: {
    background: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "7px 12px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize:"12px"
},

leaveButton: {
    width: "100%",
    marginTop: "10px",
    padding: "12px",
    background: "#d32f2f",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold"
},

deleteButton:{
    width:"100%",
    background:"#e53935",
    color:"white",
    border:"none",
    padding:"10px 15px",
    borderRadius:"6px",
    cursor:"pointer",
    marginTop:"10px"
}
};

export default Home; 
