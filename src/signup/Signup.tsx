import React from "react";

const Signup: React.FC = () => {
  const handleSignup = () => {
    window.electronAPI.signupSuccess();
  };

  return (
    <>
      <div className="w-screen h-screen flex flex-col justify-center items-center">
        <h1>Signup</h1>
        <button onClick={handleSignup}>Entrar</button>
      </div>
    </>
  );
};

export default Signup;
