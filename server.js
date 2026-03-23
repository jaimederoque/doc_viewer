const { createApp, logStartup } = require('./src/app');
const { PORT } = require('./src/config/env');

const app = createApp();

app.listen(PORT, () => {
    logStartup(PORT);
});
