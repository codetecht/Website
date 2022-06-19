'use strict';

/*
Page: DM Dashboard
Author: Joseph Kularski

Behavior and functionality for the DM Dashboard.

API Information: Uses the 5th Edition Dungeons and Dragons API. The API is open with
  authentication required. All of the information acquired through the API is licenced by Wizards of
  the Coast (WoTC) under the public Open Game License (OGL); as a result, all of the information
  acquired for use here falls under the same license.

Navigating the code:
  [A] General view
    [A.1] Assign listeners to interactables
    [A.2] Header behavior
  [B] Lookup view
    [B.1] Lookup view setup
      [B.1.a] Populate monster view
      [B.1.b] Populate spell view
    [B.2] Lookup view general behavior
    [B.2] Monster/creature lookup behavior
    [B.3] Spell lookup behavior
  [C] World view
  [D] Combat view
  [E] Dice log view
  [F] Helper functions
 */

(function() {
  // Module global constants
  const URL_BASE = 'https://www.dnd5eapi.co/api';
  const URL_SPELLS = URL_BASE + '/spells';
  const URL_MONS = URL_BASE + '/monsters';
  const LOOKUP_VIEWS = ['mon-search-view', 'spell-search-view'];
  const PAGE_VIEWS = ['lookup-view', 'world-view', 'combat-view', 'roll-log-view'];
  const CR_REGEX = /CR: (\d+)/;
  const TIME_REGEX = /(.*) GMT.*/;

  // Module global variables
  let NUM_SPELL_LEVEL_BTNS;
  let NUM_SPELL_SCHOOL_BTNS;
  let NUM_SPELL_CLASS_BTNS;
  let NUM_MON_SIZE_BTNS;
  let NUM_MON_TYPES_BTNS;

  window.addEventListener('load', init);

  /**
   * Initialize page behavior
   */
  function init() {
    populateSpellLookupCards();
    populateMonLookupCards();
    addLookupFilterListeners();
    addCheckAllBtnListeners();
    addNavBtnListeners();
    setBtnCounts();

    // Dice rollers
    qsa('.roll-dice').forEach(btn => btn.addEventListener('click', rollDice));
  }

  /**
   * Set the variables for the button counts. Saves time on repeated checks as the button sections
   * are used.
   */
  function setBtnCounts() {
    NUM_SPELL_LEVEL_BTNS = qsa('#spell-level-options input').length;
    NUM_SPELL_SCHOOL_BTNS = qsa('#spell-school-options input').length;
    NUM_SPELL_CLASS_BTNS = qsa('#spell-class-options input').length;
    NUM_MON_SIZE_BTNS = qsa('#mon-size-options input').length;
    NUM_MON_TYPES_BTNS = qsa('#mon-type-options input').length;

  }

  /*  [A] General View                                                                            */
  /*    [A.1] Assign listeners to interactables                                                   */
  /**
   * Add functionality to the navigation bar buttons
   */
  function addNavBtnListeners() {
    // Change views between the different main views
    qsa('nav > ul span').forEach(elem => elem.addEventListener('click', goToView));

    // Change views within the lookup page
    id('lookup-select').addEventListener('change', changeLookupView);
  }

  /**
   * Add functionality to the buttons which select or deselect all check boxes
   */
  function addCheckAllBtnListeners() {
    qsa('#spell-search-options button').forEach(btn => {
      btn.addEventListener('click', evt => switchSpellCheckBoxes(evt, true));
    });
    qsa('#mon-search-options button').forEach(btn => {
      btn.addEventListener('click', evt => switchMonCheckBoxes(evt, true));
    });
  }

  /**
   * Add functionality to filter checkboxes that update the list of cards shown
   */
  function addLookupFilterListeners() {
    // Spell filter checkboxes
    qsa('#spell-search-options input').forEach(option => {
      option.addEventListener('change', applySpellFilters);
    });

    // Mon filter checkboxes
    qsa('#mon-search-options input, input[type="number"]').forEach(option => {
      option.addEventListener('change', applyMonFilters);
    });
  }
  /*    end A.1 --------------------------------------------------------------------------------- */

  /*    [A.2] Header behavior                                                                     */
  /**
   * Switch between page views
   */
  function goToView() {
    const newView = this.id.replace('go-to-', '') + '-view';
    PAGE_VIEWS.forEach(view => {
      if (view === newView) {
        id(view).classList.remove('hidden');
      } else {
        id(view).classList.add('hidden');
      }
    });
  }

  /**
   * Execute a dice roll
   */
  function rollDice() {
    const options = qs('.dice-options', this.parentNode);
    const numDice = parseInt(qs('.num-dice', options).value);
    const diceSize = parseInt(qs('.dice-size', options).value);
    const rolls = [];
    let roll = 0;
    let total = 0;

    for (let i = 0; i < numDice; i++) {
      roll = Math.ceil(Math.random() * diceSize);
      rolls.push(roll);
      total += roll;
    }

    qs('.roll-results', this.parentNode).textContent = String(total);

    let rollEntry = gen('p');
    let now = new Date();
    let time = now.toTimeString().match(TIME_REGEX)[1];

    rollEntry.textContent =
      `${now.toDateString()} ${time}: ${String(rolls).replaceAll(',', ', ')} (${total})`;
    id('roll-log').appendChild(rollEntry);
  }
  /*    End A.2 --------------------------------------------------------------------------------- */
  /*  End A ===================================================================================== */

  /*  [B] Lookup view                                                                             */
  /*    [B.1] Lookup view setup                                                                   */
  /*      [B.1.a] Populate monster view                                                           */
  /**
   * Fetch the data to populate the monster lookup view cards
   */
  function populateMonLookupCards() {
    fetch(URL_MONS)
      .then(statusCheck)
      .then(res => res.json())
      .then(processPopulateMons)
      .catch(handleError);
  }

  /**
   * Process the monster view lookup data to create a card for each creature
   * @param {JSON} data - Results of fetching the monster lookup view data
   */
  function processPopulateMons(data) {
    data.results.forEach(mon => fetchMonInfo(mon.index));
  }

  /**
   * Fetch the information about a specific monster
   * @param {String} monName - The name of the creature to look up
   */
  function fetchMonInfo(monName) {
    fetch(URL_MONS + '/' + monName)
      .then(statusCheck)
      .then(res => res.json())
      .then(addMonCard)
      .catch(handleError);
  }

  /**
   * Process the specific monster information and add an info card to the monster lookup view
   * @param {JSON} data - Information about a specific monster
   */
  function addMonCard(data) {
    const monCard = gen('div');
    const monType = data.type.split(' ');
    monCard.classList.add('mon-card', 'hidden', monType[0], data.size.toLowerCase());

    // Specifically handles "swarm of tiny beasts" types
    if (monType.length > 1) {
      monCard.classList.add(
        monType[2].toLowerCase(),
        monType[3].substring(0, monType[3].length - 1)
      );
    }

    monCard.id = data.index;
    monCard.addEventListener('click', expandMonInfo);

    const monName = gen('p');
    monName.textContent =
      // Kraken
      // Gargantuan monstrosity (titan), chaotic evil
      `${data.name}\r\n` +
      `${data.size.toLowerCase()} ${data.type.toLowerCase()}, ${data.alignment}`;
    monCard.appendChild(monName);

    const monInfo = makeMonInfo(data);
    monCard.appendChild(monInfo);

    id('mon-card-container').appendChild(monCard);
  }

  /**
   * Create the bulk information element of the monster cards
   * @param {JSON} data - Monster data
   * @returns {HTMLElement} The completed monster data element
   */
  function makeMonInfo(data) {
    const monInfo = gen('div');
    monInfo.classList.add('card-info');

    const monHP = gen('p');
    monHP.textContent =
      `HP: ${data.hit_points}   AC: ${data.armor_class}   CR: ${data.challenge_rating}   ` +
      `XP: ${data.xp}`;
    monInfo.appendChild(monHP);

    const monCombat = gen('p');
    monCombat.textContent = `Attack: ${data.hit_dice}   `;
    Object.keys(data.speed).forEach(key => {
      monCombat.textContent += `${key[0].toUpperCase() + key.substring(1)}: ${data.speed[key]}   `;
    });
    monInfo.appendChild(monCombat);

    const monStats = gen('p');
    monStats.textContent =
       `STR: ${data.strength}   DEX: ${data.dexterity}   CON: ${data.constitution}`
       + `\r\nINT: ${data.intelligence}   WIS: ${data.wisdom}   CHA: ${data.charisma}`;
    monInfo.appendChild(monStats);

    return monInfo;
  }
  /*      End B.1.a - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

  /*      [B.1.b] Populate spell view                                                             */
  /**
   * Fetch the data to populate the spell lookup view cards
   */
  function populateSpellLookupCards() {
    fetch(URL_SPELLS)
      .then(statusCheck)
      .then(res => res.json())
      .then(processPopulateSpells)
      .catch(handleError);
  }

  /**
   * Process the spell view lookup data to create a card for each spell
   * @param {JSON} data - Results of fetching the spell lookup view data
   */
  function processPopulateSpells(data) {
    data.results.forEach(spell => fetchSpellInfo(spell.index));
  }

  /**
   * Fetch the information about a specific spell
   * @param {String} spellName - The name of the spell to look up
   */
  function fetchSpellInfo(spellName) {
    fetch(URL_SPELLS + '/' + spellName)
      .then(statusCheck)
      .then(res => res.json())
      .then(addSpellCard)
      .catch(handleError);
  }

  /**
   * Process the specific spell information and add an info card to the monster lookup view
   * @param {JSON} data - Information about a specific monster
   */
  function addSpellCard(data) {
    const spellCard = gen('div');
    spellCard.classList.add('spell-card', 'hidden');
    spellCard.id = data.index;

    const spellName = gen('p');
    spellName.textContent = 'Name: ' + data.name;
    spellCard.appendChild(spellName);

    const spellInfo = makeSpellInfo(data);
    spellCard.appendChild(spellInfo);

    id('spell-card-container').appendChild(spellCard);
  }

  /**
   * Create the bulk information element of the spell cards
   * @param {JSON} data - Spell data
   * @returns {HTMLElement} The completed spell data element
   */
  function makeSpellInfo(spellData) {
    const spellInfo = gen('div');
    spellInfo.classList.add('card-info');

    const spellLevel = gen('p');
    spellLevel.textContent = 'Level: ' + (spellData.level === 0 ? 'C' : spellData.level);
    spellInfo.appendChild(spellLevel);

    const spellSchool = gen('p');
    spellSchool.textContent = 'School: ' + spellData.school.name;
    spellInfo.appendChild(spellSchool);

    const classes = [];
    const spellClasses = gen('p');
    spellData.classes.forEach(cl => classes.push(cl.name));
    spellClasses.textContent = 'Classes: ' + String(classes).replaceAll(',', ', ');
    spellInfo.appendChild(spellClasses);

    const subclasses = [];
    const spellSubclasses = gen('p');
    spellData.subclasses.forEach(sub => subclasses.push(sub.name));
    spellSubclasses.textContent = 'Subclasses: ' + String(subclasses).replaceAll(',', ', ');
    spellInfo.appendChild(spellSubclasses);

    const spellDesc = gen('p');
    spellDesc.textContent = 'Description: ' + spellData.desc;
    spellInfo.appendChild(spellDesc);

    return spellInfo;
  }
  /*      End B.1.b - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
  /*    End B.1 ----------------------------------------------------------------------------------*/

  /*    [B.2] Lookup view general behavior                                                        */
  /**
   * Switch between various information lookup pages within the lookup view
   */
  function changeLookupView() {
    const changeTo = this.value;
    LOOKUP_VIEWS.forEach(view => {
      if (changeTo === view) {
        id(view).classList.remove('hidden');
      } else {
        id(view).classList.add('hidden');
      }
    })
  }
  /*    End B.2 ----------------------------------------------------------------------------------*/

  /*    [B.3] Monster/creature lookup behavior                                                    */
  /**
   * Fetch the data to place additional information into a monster card when clicked
   */
  function expandMonInfo() {
    fetch(URL_MONS + '/' + this.id)
      .then(statusCheck)
      .then(res => res.json())
      .then(processExpandMonInfo)
      .catch(handleError);
  }

  /**
   * Process the fetched monster data and add it to its card
   * @param {JSON} data - Specific monster data
   */
  function processExpandMonInfo(data) {
    const currCard = id(data.index);
    const cardInfo = qs('.card-info', currCard);
    const moreInfo = gen('p');

    let dmgVulner = '\r\n';
    data.damage_vulnerabilities.forEach(entry => {
      dmgVulner += '\t' + entry + '\r\n';
    })
    dmgVulner = dmgVulner.substring(0, dmgVulner.length - 2);

    let dmgResist = '\r\n';
    data.damage_resistances.forEach(entry => {
      dmgResist += '\t' + entry + '\r\n';
    });
    dmgResist = dmgResist.substring(0, dmgResist.length - 2);

    let condImmun = '\r\n';
    data.condition_immunities.forEach(entry => {
      condImmun += '\t' + entry.index + '\r\n';
    });
    condImmun = condImmun.substring(0, condImmun.length - 2);

    let proficiencies = '\r\n';
    data.proficiencies.forEach(entry => {
      proficiencies += `\t${entry.proficiency.name} (${entry.value})\r\n`;
    });
    proficiencies = proficiencies.substring(0, proficiencies.length - 2);

    let senses = '\r\n';
    Object.keys(data.senses).forEach(key => {
      senses += `\t${key}: ${data.senses[key]}\r\n`;
    })

    let abilities = '\r\n';
    data.special_abilities.forEach(entry => {
      abilities += `\t${entry.name}: ${entry.desc}\r\n`;
    });
    abilities = abilities.substring(0, abilities.length - 2);

    let actions = '\r\n';
    data.actions.forEach(entry => {
      actions += `\t${entry.name}: ${entry.desc}\r\n`;
    });
    actions = actions.substring(0, actions.length - 2);

    let legendaries = '\r\n';
    data.legendary_actions.forEach(entry => {
      legendaries += `\t${entry.name}: ${entry.desc}\r\n`;
    });
    legendaries = legendaries.substring(0, legendaries.length - 2);

    moreInfo.textContent += 'Vulnerabilities: ' + dmgVulner;
    moreInfo.textContent += '\r\n\r\nDamage Resistances: ' + dmgResist;
    moreInfo.textContent += '\r\n\r\nCondition Immunities: ' + condImmun;
    moreInfo.textContent += '\r\n\r\nProficiencies: ' + proficiencies;
    moreInfo.textContent += '\r\n\r\nSenses: ' + senses;
    moreInfo.textContent += '\r\n\r\nSpecial Abilities: ' + abilities;
    moreInfo.textContent += '\r\n\r\nLegendary Actions: ' + legendaries;

    cardInfo.appendChild(moreInfo);
    currCard.removeEventListener('click', expandMonInfo);
    currCard.addEventListener('click', shrinkMonInfo);
  }

  /**
   * Return the monster card to compact view
   */
  function shrinkMonInfo() {
    qs('.card-info p:last-child', this).remove();
    this.removeEventListener('click', shrinkMonInfo);
    this.addEventListener('click', expandMonInfo);
  }

  /**
   * Hide or show monster cards based on the selected filter checkboxes
   */
  function applyMonFilters() {
    // Get checked size options
    const sizes = [];
    const checkedSizes = qsa('#mon-size-options input:checked');
    checkedSizes.forEach(option => sizes.push(option.name));

    // Switch the button to fill/empty based on status
    if (checkedSizes.length == NUM_MON_SIZE_BTNS) {
      const btn = id('check-mon-sizes-btn');
      btn.removeEventListener('click', evt => switchMonCheckBoxes(evt, true));
      btn.addEventListener('click', evt => switchMonCheckBoxes(evt, false));
      btn.textContent = "Deselect All";
    } else if (checkedSizes.length == 0) {
      const btn = id('check-mon-sizes-btn');
      btn.removeEventListener('click', evt => switchMonCheckBoxes(evt, false));
      btn.addEventListener('click', evt => switchMonCheckBoxes(evt, true));
      btn.textContent = "Select All";
    }

    // Get checked type options
    const types = [];
    const checkedTypes = qsa('#mon-type-options input:checked')
    checkedTypes.forEach(option => types.push(option.name));

    // Switch the button to fill/empty based on status
    if (checkedTypes.length == NUM_MON_TYPES_BTNS) {
      const btn = id('check-mon-types-btn');
      btn.removeEventListener('click', evt => switchMonCheckBoxes(evt, true));
      btn.addEventListener('click', evt => switchMonCheckBoxes(evt, false));
      btn.textContent = "Deselect All";
    } else if (checkedTypes.length == 0) {
      const btn = id('check-mon-types-btn');
      btn.removeEventListener('click', evt => switchMonCheckBoxes(evt, false));
      btn.addEventListener('click', evt => switchMonCheckBoxes(evt, true));
      btn.textContent = "Select All";
    }

    // Get CR Range
    const minCR = parseInt(id('min-cr').value);
    const maxCR = parseInt(id('max-cr').value);

    qsa('.mon-card').forEach(card => {
      const cardClasses = Array.from(card.classList);
      const cardCR = qs('.card-info > p', card).textContent.match(CR_REGEX)[1];

      const sizeMatch = intersection(cardClasses, sizes).length > 0;
      const typeMatch = intersection(cardClasses, types).length > 0;
      const crMatch = cardCR >= minCR && cardCR <= maxCR;

      if (sizeMatch && typeMatch && crMatch) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  }

  /**
   * Switch the monster filter checkboxes to all checked or all unchecked
   * @param {Event} event - The checkbox event invoked
   * @param {boolean} setChecked - Set the checked property to this value
   */
  function switchMonCheckBoxes(event, setChecked) {
    let selector;
    switch (event.currentTarget.id) {
      case 'check-mon-sizes-btn':
        selector = '#mon-size-options input';
        break;
      case 'check-mon-types-btn':
        selector = '#mon-type-options input';
        break;
      default:
        selector = '';
        break;
    }
    qsa(selector).forEach(box => box.checked = setChecked);
    applyMonFilters();
  }
  /*    End B.3 ----------------------------------------------------------------------------------*/

  /*    [B.4] Spell lookup behavior                                                               */
  /**
   * Switch the spell filter checkboxes to all checked or all unchecked
   * @param {Event} event - The checkbox event invoked
   * @param {boolean} setChecked - Set the checked property to this value
   */
  function switchSpellCheckBoxes(event, setChecked) {
    let selector;
    switch (event.currentTarget.id) {
      case 'check-spell-schools-btn':
        selector = '#spell-school-options input';
        break;
      case 'check-spell-levels-btn':
        selector = '#spell-level-options input';
        break;
      case 'check-spell-classes-btn':
        selector = '#spell-class-options input';
        break;
      default:
        selector = '';
        break;
    }
    qsa(selector).forEach(box => box.checked = setChecked);
    applySpellFilters();
  }

  /**
   * Hide or show spell cards based on the selected filter checkboxes
   */
  function applySpellFilters() {
    // Get checked level options
    const levels = [];
    const checkedLevels = qsa('#spell-level-options input:checked');
    checkedLevels.forEach(option => levels.push(option.name.replace('level', '')));
    if (levels.includes('0')) {
      levels[levels.indexOf('0')] = 'C';
    }

    // Switch level button to fill/empty based on status
    if (checkedLevels.length == NUM_SPELL_LEVEL_BTNS) {
      const btn = id('check-spell-levels-btn');
      btn.removeEventListener('click', evt => switchSpellCheckBoxes(evt, true));
      btn.addEventListener('click', evt => switchSpellCheckBoxes(evt, false));
      btn.textContent = "Deselect All";
    } else if (checkedLevels.length == 0) {
      const btn = id('check-spell-levels-btn');
      btn.removeEventListener('click', evt => switchSpellCheckBoxes(evt, false));
      btn.addEventListener('click', evt => switchSpellCheckBoxes(evt, true));
      btn.textContent = "Select All";
    }

    // Get checked school options
    const schools = [];
    const checkedSchools = qsa('#spell-school-options input:checked');
    checkedSchools.forEach(option => schools.push(option.name));

    // Switch school button to fill/empty based on status
    if (checkedSchools.length == NUM_SPELL_SCHOOL_BTNS) {
      const btn = id('check-spell-schools-btn');
      btn.removeEventListener('click', evt => switchSpellCheckBoxes(evt, true));
      btn.addEventListener('click', evt => switchSpellCheckBoxes(evt, false));
      btn.textContent = "Deselect All";
    } else if (checkedSchools.length == 0) {
      const btn = id('check-spell-schools-btn');
      btn.removeEventListener('click', evt => switchSpellCheckBoxes(evt, false));
      btn.addEventListener('click', evt => switchSpellCheckBoxes(evt, true));
      btn.textContent = "Select All";
    }

    // Get checked class options
    const classes = [];
    const checkedClasses = qsa('#spell-class-options input:checked');
    checkedClasses.forEach(option => classes.push(option.name));

    // Switch class button to fill/empty based on status
    if (checkedClasses.length == NUM_SPELL_CLASS_BTNS) {
      const btn = id('check-spell-classes-btn');
      btn.removeEventListener('click', evt => switchSpellCheckBoxes(evt, true));
      btn.addEventListener('click', evt => switchSpellCheckBoxes(evt, false));
      btn.textContent = "Deselect All";
    } else if (checkedClasses.length == 0) {
      const btn = id('check-spell-classes-btn');
      btn.removeEventListener('click', evt => switchSpellCheckBoxes(evt, false));
      btn.addEventListener('click', evt => switchSpellCheckBoxes(evt, true));
      btn.textContent = "Select All";
    }

    // Apply the filters
    qsa('.spell-card').forEach(card => {
      let spellLvl = qs('.card-info > p:nth-child(1)', card).innerText.replace('Level: ', '');
      if (spellLvl === '0') {
        spellLvl = 'C';
      }
      const spellSch = qs('.card-info > p:nth-child(2)', card).innerText.replace('School: ', '');
      let spellCls = qs('.card-info > p:nth-child(3)', card).innerText.replace('Classes: ', '');
      spellCls = spellCls.split(', ').map(cl => cl.toLowerCase());

      const levelMatch = levels.includes(spellLvl);
      const schoolMatch = schools.includes(spellSch.toLowerCase());
      const classMatch = intersection(spellCls, classes).length > 0;

      if (levelMatch && schoolMatch && classMatch) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  }
  /*    End B.4 ----------------------------------------------------------------------------------*/
  /*  End B ===================================================================================== */

  /*  [C] World view                                                                              */
  /*  End C ===================================================================================== */

  /*  [D] Combat view                                                                             */
  /*  End D ===================================================================================== */

  /*  [E] Dice log view                                                                           */
  /*  End E ===================================================================================== */

  /*  [F] Helper functions                                                                        */
  /**
   * Determine the set intersection of two Arrays
   * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
   * @param {Array} fst
   * @param {Array} snd
   * @returns {Array} Intersection of the two input Arrays
   */
  function intersection(fst, snd) {
    let _intersection = [];
    for (let elem of snd) {
      if (fst.includes(elem)) {
        _intersection.push(elem);
      }
    }
    return _intersection;
  }

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
    console.error(err);
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
  /*  End F ===================================================================================== */

})();
