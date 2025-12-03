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
const chef_route_1 = __importDefault(require("./routes/chef.route"));
const menu_routes_1 = __importDefault(require("./routes/menu.routes"));
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
app.use(apiPrefix, chef_route_1.default);
app.use(apiPrefix, menu_routes_1.default);
app.use(apiPrefix, stateRoutes_1.default);
// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
