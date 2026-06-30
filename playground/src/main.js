import { createApp } from 'vue';
import App from './App.vue';
import React from 'react';
import ReactDOM from 'react-dom/client';
import ReactExample from './ReactExample';

// Mount the Vue app
createApp(App).mount('#app');

// Wait for the DOM to be ready before mounting the React component
setTimeout(() => {
  const reactContainer = document.createElement('div');
  reactContainer.id = 'react-root';
  const container = document.querySelector('.react-example-container');
  if (container) {
    container.appendChild(reactContainer);
    ReactDOM.createRoot(reactContainer).render(React.createElement(ReactExample));
  }
}, 0);
