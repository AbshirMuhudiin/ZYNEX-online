# ZYNEX online store Inventory Management System

A modern web-based Inventory Management System designed to help businesses efficiently manage products, sales, customers, credit payments, expenses, reports, and notifications. The system simplifies daily business operations by providing a centralized platform for inventory control and financial tracking.

---

## Features

### Authentication & User Management

- Secure User Login
- User Registration
- User Management
- Role-Based Access Control
- Password Encryption using JWT Authentication

### Dashboard

- Business Overview
- Sales Summary
- Inventory Statistics
- Customer Statistics
- Expense Summary
- Quick Access to System Modules

### Customer & Credit Management

- Add New Customers
- Update Customer Information
- Customer List
- Credit Sales Management
- Credit Payment Tracking
- Remaining Balance Monitoring
- Customer Payment History

### Inventory Management

- Add New Items
- Edit Item Information
- Delete Items
- Product Categories
- Stock Quantity Management
- Product Price Management
- Inventory Availability Tracking

### Order Management

- Create New Orders
- Sales Processing
- Order History
- Customer Orders
- Order Details
- Sales Records

### Expense Management

- Record Daily Expenses
- Update Expenses
- Delete Expenses
- Expense Categories
- Expense History
- Financial Tracking

### Reports

- Sales Reports
- Expense Reports
- Customer Reports
- Inventory Reports
- Credit Payment Reports
- Business Performance Summary

### Notifications

- Low Stock Alerts
- Credit Due Notifications
- Payment Notifications
- Important System Alerts

---

## Technology Stack

### Frontend

- React.js
- React Router DOM
- Axios
- HTML5
- CSS3
- JavaScript

### Backend

- Node.js
- Express.js
- JWT Authentication
- Multer
- Bcrypt.js
- CORS

### Database

- MySQL

### Development Tools

- Visual Studio Code
- Git
- GitHub
- Postman

---

## Project Structure

```
Iftin-Market/
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── package.json
│
├── Backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── config/
│   ├── app.js
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/cabdi45cade-maker/Iftin-Market.git
```

### Navigate to the Project

```bash
cd Zynex store
```

### Install Backend Dependencies

```bash
cd Backend
npm install
```

### Start Backend

```bash
npm run dev
```

or

```bash
npm start
```

### Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Start Frontend

```bash
npm start
```

---

## Environment Variables

Create a `.env` file inside the **Backend** folder.

```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=zynex

JWT_SECRET=your_secret_key
```

---

## Future Improvements

- Barcode Scanner Integration
- Receipt Printing
- Sales Analytics Dashboard
- Supplier Management
- Multi-Store Support
- Email Notifications
- SMS Notifications
- Backup & Restore
- Mobile Application
- Cloud Deployment

---

## Author

**Cabdi Muhudiin**

Email: **cabdi45cade@gmail.com**

GitHub: https://github.com/cabdi45cade-maker

---

## License

This project is licensed under the MIT License.

---

## Support

If you found this project useful, please consider giving it a ⭐ on GitHub.

Thank you for visiting the **Iftin Market Inventory Management System** repository.
