import {Router} from 'express';
import {register,login,me} from '../controllers/authController.js';
import * as c from '../controllers/catalogController.js';
import * as o from '../controllers/operationsController.js';
import {protect,admin,upload,receiptUpload} from '../middleware/core.js';

const r=Router();
const guarded=[protect,admin];

r.post('/auth/login',login);
r.post('/auth/register',register);
r.get('/auth/me',protect,me);

r.get('/products',c.listProducts);
r.get('/products/:id',c.getProduct);
r.post('/products',...guarded,upload.array('images',8),c.createProduct);
r.put('/products/:id',...guarded,upload.array('images',8),c.updateProduct);
r.delete('/products/:id',...guarded,c.deleteProduct);

r.get('/categories',c.listCategories);
r.get('/categories/:id',c.getCategory);
r.post('/categories',...guarded,c.createCategory);
r.put('/categories/:id',...guarded,c.updateCategory);
r.delete('/categories/:id',...guarded,c.deleteCategory);

r.post('/orders',o.createOrder);
r.get('/orders/my-orders',protect,o.myOrders);
r.get('/orders/:id',protect,o.getOrder);
r.post('/orders/:id/payment-receipt',protect,receiptUpload.single('receipt'),o.uploadReceipt);
r.get('/orders/:id/payment-receipt',...guarded,o.downloadReceipt);
r.get('/orders',...guarded,o.adminOrders);
r.put('/orders/:id/status',...guarded,o.updateOrderStatus);
r.put('/orders/:id/payment-status',...guarded,o.updatePaymentStatus);
r.put('/orders/:id/shipment',...guarded,o.updateShipment);

r.get('/users',...guarded,o.users);
r.put('/users/:id',...guarded,o.updateUser);
r.put('/users/:id/role',...guarded,o.updateUser);
r.put('/users/:id/status',...guarded,o.updateUser);
r.delete('/users/:id',...guarded,o.deleteUser);

r.post('/messages',o.sendMessage);
r.get('/messages',...guarded,o.messages);
r.put('/messages/:id',...guarded,o.updateMessage);
r.get('/admin/stats',...guarded,o.stats);

export default r;
