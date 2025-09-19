import React, { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebase'; // Import auth from your firebase.js file

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null); // Reset error before new attempt
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // Signed in 
            const user = userCredential.user;
            console.log('Logged in successfully:', user);
            // You can redirect the user or update the state here
        } catch (error) {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Error logging in:", errorCode, errorMessage);
            setError(errorMessage); // Display error to the user
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <div>
                    <label>Email:</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                    <label>Password:</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit">Log In</button>
            </form>
        </div>
    );
};

export default Login;