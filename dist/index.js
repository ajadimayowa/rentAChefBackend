"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./config/db"));
const morgan_1 = __importDefault(require("morgan"));
const stateRoutes_1 = __importDefault(require("./routes/stateRoutes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const chef_route_1 = __importDefault(require("./routes/chef.route"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const services_routes_1 = __importDefault(require("./routes/services.routes"));
const chefService_routes_1 = __importDefault(require("./routes/chefService.routes"));
const servicepricing_route_1 = __importDefault(require("./routes/servicepricing.route"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const menu_routes_1 = __importDefault(require("./routes/menu.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const specialmenu_routes_1 = __importDefault(require("./routes/specialmenu.routes"));
const booking_routes_1 = __importDefault(require("./routes/booking.routes"));
const quote_routes_1 = __importDefault(require("./routes/quote.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const procurement_routes_1 = __importDefault(require("./routes/procurement.routes"));
const favorite_routes_1 = __importDefault(require("./routes/favorite.routes"));
const rating_routes_1 = __importDefault(require("./routes/rating.routes"));
const chefRating_routes_1 = __importDefault(require("./routes/chefRating.routes"));
const clientRating_routes_1 = __importDefault(require("./routes/clientRating.routes"));
dotenv_1.default.config();
// Connect to DB
(0, db_1.default)().catch((err) => {
    console.error('Failed to connect to DB:', err.message);
    process.exit(1);
});
const app = (0, express_1.default)();
// Middlewares
if (process.env.NODE_ENV === 'development')
    app.use((0, morgan_1.default)('dev'));
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const apiPrefix = '/api/v1/';
// Routes
app.use(apiPrefix, auth_routes_1.default);
app.use(apiPrefix, admin_routes_1.default);
app.use(apiPrefix, chef_route_1.default);
app.use(apiPrefix, category_routes_1.default);
app.use(apiPrefix, services_routes_1.default);
app.use(apiPrefix, chefService_routes_1.default);
app.use(apiPrefix, servicepricing_route_1.default);
app.use(apiPrefix, user_routes_1.default);
app.use(apiPrefix, menu_routes_1.default);
app.use(apiPrefix, quote_routes_1.default);
app.use(apiPrefix, payment_routes_1.default);
app.use(apiPrefix, specialmenu_routes_1.default);
app.use(apiPrefix, booking_routes_1.default);
app.use(apiPrefix, stateRoutes_1.default);
app.use(apiPrefix, notification_routes_1.default);
app.use(apiPrefix, procurement_routes_1.default);
app.use(apiPrefix, favorite_routes_1.default);
app.use(apiPrefix, chefRating_routes_1.default);
app.use(apiPrefix, rating_routes_1.default);
app.use(apiPrefix, clientRating_routes_1.default);
// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
