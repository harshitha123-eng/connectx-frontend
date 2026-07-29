import { useState } from "react";
import { loginUser } from "../services/AuthService";
import { useNavigate } from "react-router-dom";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    const handleLogin = async () => {
    try {
        const response = await loginUser({
            username,
            password,
        });

        console.log(response.data);

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userId", response.data.userId);
        localStorage.setItem("username", response.data.username);

        navigate("/home");

    } catch (error) {
        console.log(error);
        alert("Login Failed");
    }
};

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1>ConnectX</h1>

                <h3>Login</h3>

                <input
                    type="text"
                    placeholder="Enter Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={styles.input}
                />

                <input
                    type="password"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                />

                <button
                    style={styles.button}
                    onClick={handleLogin}
                >
                    Login
                </button>

                <p>Don't have an account?</p>

                <a href="/register">Register</a>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f2f2f2",
    },

    card: {
        background: "white",
        padding: "30px",
        borderRadius: "10px",
        width: "350px",
        boxShadow: "0px 0px 10px gray",
        textAlign: "center",
    },

    input: {
        width: "100%",
        padding: "10px",
        margin: "10px 0",
    },

    button: {
        width: "100%",
        padding: "10px",
        backgroundColor: "blue",
        color: "white",
        border: "none",
        cursor: "pointer",
    },

    
};
<p
    style={{
        marginTop: "15px",
        cursor: "pointer",
        color: "#128C7E"
    }}
    onClick={() => navigate("/register")}
>
    Create New Account
</p>

export default Login;