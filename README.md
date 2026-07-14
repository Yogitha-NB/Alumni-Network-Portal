# Alumni-Network-Portal

The Alumni Network Portal is a comprehensive full-stack web application developed as part of the Junior Software Developer Internship programme.The project was built using React.js for the frontend and Python Flask for the backend, with SQLite as the database through the
SQLAlchemy ORM.The application serves as a complete digital platform connecting alumni with current students, enabling professional networking, mentorship, career opportunities, and community engagement.
The portal addresses a real-world need — creating a centralised, secure, and feature-rich platform where alumni can reconnect with their institution, share success stories, post job opportunities, and guide current students through mentorship. Students benefit by accessing
industry professionals, finding internships, and participating in alumni-driven events and discussions.

📁 Project Structure:

ALUMNI-PORTAL/  <br>
│ <br>
├── backend/  <br>
│   ├── app.py <br>
│   ├── requirements.txt <br>
│   └── instance/ <br>
│       └──alumni.db <br>
│ <br>
├── frontend/ <br>
│   ├── public/<br>
│   │   └── index.html <br>
│   ├── src/ <br>
│   │   ├── App.js <br>
│   │   └── index.js <br>
│   ├── package.json <br>
│   ├── package-lock.json <br>
│ <br>
├── README.md <br>
└── .gitignore

🛠️Technologies Used:

Frontend: React.js ,Bootstrap, CSS ,JavaScript <br>
Backend: Python ,Flask <br>
Database:SQLite

⚙️ Installation

Run in 3 Steps: 


```bash
cd backend
pip install flask flask-sqlalchemy flask-cors flask-socketio flask-limiter flasgger PyJWT eventlet
python app.py

### Step 2 — Create Admin (open browser, run once)
http://localhost:5000/api/auth/seed
Admin login: **admin@alumni.com** / **admin123**

### Step 3 — Frontend
```bash
cd frontend
npm install
npm start


🎯 Outcome

<img width="1337" height="640" alt="Screenshot (889)" src="https://github.com/user-attachments/assets/45b3f703-0bb5-40cd-8a75-c592eb903c92" />

<img width="1340" height="636" alt="Screenshot (890)" src="https://github.com/user-attachments/assets/90f01371-7ef6-4112-aafc-94dace20f1c3" />

<img width="1358" height="638" alt="Screenshot (891)" src="https://github.com/user-attachments/assets/f4c64dd6-16e5-40e8-b301-90194462d71c" />

<img width="1363" height="647" alt="Screenshot (892)" src="https://github.com/user-attachments/assets/0bf6ab9e-381b-4b02-bd4b-582404067bf6" />

<img width="1355" height="640" alt="Screenshot (893)" src="https://github.com/user-attachments/assets/9a5a4b3c-74f4-485c-9b02-cd167d817b71" />

<img width="1353" height="632" alt="Screenshot (894)" src="https://github.com/user-attachments/assets/64080135-3966-49f1-961b-760ecd159d36" />

<img width="1350" height="636" alt="Screenshot (895)" src="https://github.com/user-attachments/assets/c601cc62-bfa3-4b4c-9634-dcf8f91eeeae" />

<img width="1354" height="640" alt="Screenshot (896)" src="https://github.com/user-attachments/assets/544f7499-7a45-4264-be64-fb23a56b1404" />
