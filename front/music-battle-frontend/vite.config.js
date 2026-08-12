import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            // 프론트에서 '/api/...' 로 요청하면 Vite 개발 서버가
            // 대신 백엔드(8080)로 전달해준다. 브라우저 입장에선 항상
            // 같은 출처(5173)로만 요청하는 것처럼 보여서 CORS가 발생하지 않는다.
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
        },
    },
});
