import SockJS from "sockjs-client/dist/sockjs";
import { Client } from "@stomp/stompjs";

let stompClient = null;

export const connectWebSocket = (
    userId,
    onMessageReceived,
    onTypingReceived,
    onStatusReceived,
    onReadReceiptReceived,
    onDeliveredReceived,
    onReactionReceived,
    onNotificationReceived,
    onDeleteMessageReceived,
    onConnected
) => {

   const socket = new SockJS("https://connectx-backend-1-nv31.onrender.com/chat");

    const token = localStorage.getItem("token");

    stompClient = new Client({

        webSocketFactory: () => socket,

        reconnectDelay: 5000,

        connectHeaders: {
            Authorization: "Bearer " + token
        },

        onConnect: () => {

            console.log("WebSocket Connected");

        console.log("SUBSCRIBING TO STATUS");

        stompClient.subscribe("/topic/status", (msg) => {
            console.log("STATUS EVENT RECEIVED:", msg.body);
            onStatusReceived(JSON.parse(msg.body));
            });

        stompClient.subscribe(
             "/topic/private/" + userId,
            (message) => {

            const data = JSON.parse(message.body);


                if(data.type === "DELETE_MESSAGE"){

                console.log(
                "DELETE MESSAGE:",
                data
            );

            if(onDeleteMessageReceived){
                onDeleteMessageReceived(data);
            }

            return;
        }


        console.log(
            "PRIVATE MESSAGE RECEIVED:",
            data
        );

        onMessageReceived(data);

    }
);

        stompClient.subscribe("/topic/typing/" + userId, (message) => {
              onTypingReceived(JSON.parse(message.body));
            });

        stompClient.subscribe("/topic/read/" + userId, (message) => {
                console.log("READ RECEIPT EVENT:", message.body);
                onReadReceiptReceived(JSON.parse(message.body));
            });

        stompClient.subscribe("/topic/delivered/" + userId, (message) => {
                onDeliveredReceived(Number(message.body));
            });

        stompClient.subscribe("/topic/reactions/" + userId, (message) => {
            console.log("REACTION RECEIVED:", message.body);

               if (onReactionReceived) {
               onReactionReceived(JSON.parse(message.body));
            }
            });

        stompClient.subscribe("/topic/notifications/" + userId, (message) => {

             console.log("NOTIFICATION RECEIVED:", message.body);

             if (onNotificationReceived) {
             onNotificationReceived(JSON.parse(message.body));
            }
           });

            
            if (onConnected) {
                onConnected();
            }
        }
    });

    stompClient.activate();
};

        export const sendPrivateMessage = (message) => {
            if (stompClient && stompClient.connected) {
            stompClient.publish({
            destination: "/app/private-message",
            body: JSON.stringify(message)
        });
    }
};

       export const sendGroupMessage = (message) => {
            if (stompClient && stompClient.connected) {

             stompClient.publish({

            destination: "/app/group-message",

            body: JSON.stringify(message)

        });

    }

};

            export const subscribeToGroup = (
            groupId,
            onMessageReceived,
            onDeleteMessageReceived,
            onGroupTypingReceived,
            ) => {


            if(stompClient && stompClient.connected){

            stompClient.subscribe(
            "/topic/group/" + groupId,
            (message)=>{


            const data = JSON.parse(
                message.body
                );


            if(data.type === "DELETE_MESSAGE"){

                if(onDeleteMessageReceived){
                    onDeleteMessageReceived(data);
                    }

                    return;
                }


                console.log(
                    "GROUP MESSAGE RECEIVED:",
                    data
                );


                onMessageReceived(data);

            }
        );

             stompClient.subscribe(
             "/topic/group-typing/" + groupId,
            (message) => {

            const data = JSON.parse(message.body);

            console.log("GROUP TYPING:", data);

        if (onGroupTypingReceived) {
            onGroupTypingReceived(data);
        }

    }
);

    }

};

        export const sendTyping = (typingData) => {
              if (stompClient && stompClient.connected) {
              stompClient.publish({
              destination: "/app/typing",
              body: JSON.stringify(typingData)
        });
    }
};

        export const sendGroupTyping = (typingData) => {

              console.log("SENDING GROUP TYPING:", typingData);

              if (stompClient && stompClient.connected) {

              stompClient.publish({

               destination: "/app/group-typing",

               body: JSON.stringify(typingData)

        });

    }

};

        export const sendReadReceipt = (readReceipt) => {
              if (stompClient && stompClient.connected) {
              stompClient.publish({
              destination: "/app/read",
              body: JSON.stringify(readReceipt)
        });
    }
};

        export const sendDeleteMessage = (messageId)=>{

              if(stompClient && stompClient.connected){

              stompClient.publish({

              destination:"/app/delete-message",

              body: JSON.stringify(messageId)

        });

    }

};

        export const disconnectWebSocket = () => {
               if (stompClient) {
               stompClient.deactivate();
               stompClient = null;
    }
};