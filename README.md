## Required NPM Packages

To run the Visual Authentication Guide, you only need to install **one set of packages** using a single command. These are all backend dependencies managed by Node.js and NPM (Node Package Manager).

### Installation Command

Open your terminal in the project's root directory (`visual-auth-guide/`) and run this command:

```
npm install express cookie-parser jsonwebtoken cors
```

### What Each Package Does

Here is a simple breakdown of what each installed package is responsible for:

| Package           | Role                                   | Why We Need It                                                                                               |
| ----------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `express`         | **The Web Server**                     | This is the foundation of our backend. It creates the server, listens for browser requests, and defines our API routes (like `/login` or `/profile`). |
| `cookie-parser`   | **The Cookie Reader**                  | A helper library that makes it easy for our Express server to read and understand the cookies sent by the browser. Essential for the **Session** demo. |
| `jsonwebtoken`    | **The "VIP Pass" Creator & Validator** | This package handles everything related to JSON Web Tokens. It creates, signs, and verifies them, forming the core of our **JWT** demo. |
| `cors`            | **The Security Guard**                 | Stands for Cross-Origin Resource Sharing. It's a security middleware that allows our frontend (running in the browser) to safely make API requests to our backend server. Without it, the browser would block the requests. |
