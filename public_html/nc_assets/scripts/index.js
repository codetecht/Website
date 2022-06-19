'use strict';

(function () {
  const VIEWS = ['home', 'about', 'resume'];

  window.addEventListener('load', init);

  function init() {
    id('link-home').addEventListener('click', goToHome);
    id('link-about').addEventListener('click', goToAbout);
    id('link-resume').addEventListener('click', goToResume);
  }

  /* Switch to various views */
  function goToHome() {
    showView('home');
  }
  function goToAbout() {
    showView('about');
  }
  function goToResume() {
    showView('resume');
  }

  function showView(show) {
    VIEWS.forEach(view => {
      if (show === view) {
        id(show + '-view').classList.remove('hidden');
      } else {
        id(view + '-view').classList.add('hidden');
      }
    });
  }
  /* ----------------------- */

  /**
   * Verifies that the API request received a satisfactory response
   * @param {Response} res - Response from the server
   * @returns {Response} the unchanged response if the status code is ok, throws an error otherwise
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Handles errors
   * @param {Error} err - Error from the caller to handle
   */
  function handleError(err) {
    const buttons = ['search-btn', 'home-btn', 'yip-btn'];
    id('yipper-data').classList.add('hidden');
    id('error').classList.remove('hidden');
    id('error').textContent = err.message;
    buttons.forEach(btn => {
      id(btn).disabled = true;
    });
  }

  /**
   * Wrapper for the querySelector function.
   * @param {String} sel - The selector to query for.
   * @param {HTMLElement} src - The source object to query on
   * @returns {Element} the element queried for, if it exists.
   */
  function qs(sel, src = document) {
    return src.querySelector(sel);
  }

  /**
   * Wrapper for the querySelectorAll function.
   * @param {String} sel - The selector to query for.
   * @param {HTMLElement} src - The source object to query on
   * @returns {Array} a list of the elements queried for, or null if none exist.
   */
  function qsa(sel, src = document) {
    return src.querySelectorAll(sel);
  }

  /**
   * Wrapper for the getElementById function.
   * @param {String} name - The the element's ID.
   * @returns {Element} the element queried for, if it exists.
   */
  function id(name) {
    return document.getElementById(name);
  }

  /**
   * Wrapper for the createElement function.
   * @param {String} type - Name of the element to create
   * @returns {HTMLElement} the new element
   */
  function gen(type) {
    return document.createElement(type);
  }
})();