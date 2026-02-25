"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultQueueOptions = exports.FURY_ROUTER_QUEUE_NAME = exports.REDIS_CONNECTION_CONFIG = void 0;
exports.REDIS_CONNECTION_CONFIG = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
};
exports.FURY_ROUTER_QUEUE_NAME = 'FURY_ROUTER_QUEUE';
const getDefaultQueueOptions = () => ({
    connection: exports.REDIS_CONNECTION_CONFIG,
});
exports.getDefaultQueueOptions = getDefaultQueueOptions;
//# sourceMappingURL=queue.config.js.map