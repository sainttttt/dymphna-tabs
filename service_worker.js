'use strict';

import { autoSaveTabs }  from "./shared.js";

chrome.alarms.onAlarm.addListener(() => {
  console.log("saved tabs");
  autoSaveTabs();
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  // if (reason !== 'install') {
  //   return;
  // }

  // Create an alarm so we have something to look at in the demo
  await chrome.alarms.create('demo-default-alarm', {
    delayInMinutes: 1,
    periodInMinutes:10,
  });
});
