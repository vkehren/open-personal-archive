import {isNullish} from "./WebBaseLite.js";

const NAME = "open-personal-archive-web-rendering";
const VERSION = "2.4.0";
const AUTHOR = "Ryan Stephen Ehrenreich";
const COPYRIGHT = "Copyright © 2021 Open Personal Archive™";

const DEFAULT_REFRESH_WAIT_IN_MS = 1; // refresh on next tick
function refreshPageOnTimeout(refreshWaitInMs = DEFAULT_REFRESH_WAIT_IN_MS) {
  const timeoutId = setTimeout(function() {
    window.location.reload();
  }, refreshWaitInMs);
  return timeoutId;
}

const DEFAULT_INACTIVITY_WAIT_IN_MS = (10 * 60000); // refresh in 10 minutes
function schedulePageRefreshForInactivity(inactivityWaitInMs = DEFAULT_INACTIVITY_WAIT_IN_MS) {
  let inactivityTimeoutId = refreshPageOnTimeout(inactivityWaitInMs);

  document.onkeydown = function(event) {
    clearTimeout(inactivityTimeoutId);
    inactivityTimeoutId = refreshPageOnTimeout(inactivityWaitInMs);
  };
  document.onmousemove = function(event) {
    clearTimeout(inactivityTimeoutId);
    inactivityTimeoutId = refreshPageOnTimeout(inactivityWaitInMs);
  };
  document.ontouchmove = function(event) {
    clearTimeout(inactivityTimeoutId);
    inactivityTimeoutId = refreshPageOnTimeout(inactivityWaitInMs);
  };
}

function hasViewportChangedWithoutResize(bottomRightElement, maxDistanceFromXMax = null, maxDistanceFromYMax = null) {
  if (isNullish(bottomRightElement)) {
    throw new Error("A valid element that is expected to be alligned to the bottom-right of the viewport must be provided.");
  }

  const elementBounds = bottomRightElement.getBoundingClientRect();
  const elementXMaxValue = (elementBounds.right + maxDistanceFromXMax);
  const windowXMaxValue = window.innerWidth;
  const xDifference = (elementXMaxValue - windowXMaxValue);
  const elementYMaxValue = (elementBounds.bottom + maxDistanceFromYMax);
  const windowYMaxValue = window.innerHeight;
  const yDifference = (elementYMaxValue - windowYMaxValue);
  const xNeedsRefresh = (!isNullish(maxDistanceFromXMax)) ? (xDifference < 0) : false;
  const yNeedsRefresh = (!isNullish(maxDistanceFromYMax)) ? (yDifference < 0) : false;
  const needsRefresh = (xNeedsRefresh || yNeedsRefresh);
  return (needsRefresh);
}

function scheduleResizeEventIfNeeded(bottomRightElement, maxDistanceFromXMax = null, maxDistanceFromYMax = null) {
  const resizeData = {resizeNeeded: false, timeoutId: null};
  if (!hasViewportChangedWithoutResize(bottomRightElement, maxDistanceFromXMax, maxDistanceFromYMax)) {
    return resizeData;
  }

  const timeoutId = setTimeout(function() {
    const resizeEvent = new Event("resize");
    window.dispatchEvent(resizeEvent);

    // NOTE: Setting the "timeoutId" to "null" means the resize event was already dispatched
    resizeData.timeoutId = null;
  }, DEFAULT_REFRESH_WAIT_IN_MS);

  resizeData.resizeNeeded = true;
  resizeData.timeoutId = timeoutId;
  return resizeData;
}

// NOTE: This function is useful when the mobile browser address bar collapses without causing a resize event
function forceResizeEventIfNeeded(bottomRightElement, maxDistanceFromXMax = null, maxDistanceFromYMax = null) {
  if (isNullish(bottomRightElement)) {
    return;
  }

  let resizeData = null;
  window.onresize = function(event) {
    resizeData = scheduleResizeEventIfNeeded(bottomRightElement, maxDistanceFromXMax, maxDistanceFromYMax);
  }
  document.onscroll = function(event) {
    resizeData = scheduleResizeEventIfNeeded(bottomRightElement, maxDistanceFromXMax, maxDistanceFromYMax);
  }
  document.ontouchmove = function(event) {
    resizeData = scheduleResizeEventIfNeeded(bottomRightElement, maxDistanceFromXMax, maxDistanceFromYMax);
  }
}

export {refreshPageOnTimeout, schedulePageRefreshForInactivity, forceResizeEventIfNeeded};
