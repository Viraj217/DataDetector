/**
 * @format
 */

import { AppRegistry } from 'react-native';
import BackgroundFetch from 'react-native-background-fetch';
import App from './App';
import { name as appName } from './app.json';
import { initDatabase } from './src/database/db';
import { headlessTask } from './src/services/backgroundSync';

// Initialize SQLite database schema
initDatabase();

// Register background fetch headless task
BackgroundFetch.registerHeadlessTask(headlessTask);

AppRegistry.registerComponent(appName, () => App);
