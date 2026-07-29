import { useState } from "react";
import { registerUser } from "../services/AuthService";
import { useNavigate } from "react-router-dom";

function Register() {

    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    const handleRegister = async () => {

        if (
            fullName === "" ||
            username === "" ||
            email === "" ||
            password === ""
        ) {

            alert("Please fill all fields");
            return;
        }

        try {

            const response = await registerUser({

                fullName,
                username,
                email,
                password

            });

            alert(response.data);

            navigate("/");

        }

        catch (error) {

            if (error.response) {

                alert(error.response.data);

            }

            else {

                alert("Registration Failed");

            }

        }

    };

    return (

        <div style={styles.container}>

            <div style={styles.card}>

                <h1 style={{ color: "#128C7E" }}>
                    ConnectX
                </h1>

                <h3>Create Account</h3>

                <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) =>
                        setFullName(e.target.value)
                    }
                    style={styles.input}
                />

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) =>
                        setUsername(e.target.value)
                    }
                    style={styles.input}
                />

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) =>
                        setEmail(e.target.value)
                    }
                    style={styles.input}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                    style={styles.input}
                />

                <button
                    style={styles.button}
                    onClick={handleRegister}
                >
                    Register
                </button>

                <p
                    style={{
                        marginTop: "15px",
                        cursor: "pointer",
                        color: "#128C7E"
                    }}
                    onClick={() => navigate("/")}
                >
                    Already have an account? Login
                </p>

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
        background: "#ECE5DD"

    },

    card: {

        background: "#fff",
        padding: "40px",
        width: "350px",
        borderRadius: "12px",
        boxShadow: "0 0 10px rgba(0,0,0,0.2)",
        textAlign: "center"

    },

    input: {

        width: "100%",
        padding: "12px",
        marginTop: "12px",
        borderRadius: "8px",
        border: "1px solid #ccc",
        fontSize: "15px"

    },

    button: {

        width: "100%",
        padding: "12px",
        marginTop: "20px",
        border: "none",
        borderRadius: "8px",
        background: "#128C7E",
        color: "#fff",
        fontSize: "16px",
        cursor: "pointer"

    }

};

export default Register;