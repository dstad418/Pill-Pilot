// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const axios = require('axios');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add(`Welcome to Pill Pilot!`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

/**********************************************
	FIND-PHARMACY-INFORMATION FUNCTION
**********************************************/
  function findPharmacy(agent) {
  	const responseTemplates = [
      // Array of random choices
      "Your pharmacy is located at 1289 SE Clinton St. Portland, Oregon. 97202. The hours of operation are 9am to 9pm, 7 days a week. The phone number is 1-888-585-1387. Is there anything else I can do for you?",
      "Your pharmacy is located at 12705 NE Broadway Ave. Portland, Oregon. 97222. The hours of operation are 12am to 12pm, 7 days a week. The phone number is 1-888-867-5309. What else can I do for you?",
      "Your pharmacy is located at 999 SE Belmont St. Portland, Oregon. 97204. The hours of operation are 9am to 4pm, Monday through Friday. The phone number is 1-800-322-8814. Did you need anything else?",
    ];

    // One chosen at random
    const randomIndex = Math.floor(Math.random() * responseTemplates.length);
    const responseTemplate = responseTemplates[randomIndex];

    // Returned
    agent.add(responseTemplate);
  }
 
/**********************************************
	WHEN-WAS-PRESCRIPTION-LAST-FILLED FUNCTION
**********************************************/
  function prescripLastFilled(agent) {
    // Array of random choices
    const responseTemplates = [
      'Found it! It looks like the last time you refilled your medication was:',
      'Of course, it looks like the last time your medication was refilled was:',
      'Sure, the last time your medication was refilled was:',
      'Got it! You last refilled your medication on:',
    ];

    // A date API, it pulls a 'long' date, which I thought was best VUI option available
    const apiURL = 'https://api.lrs.org/random-date-generator';
    return axios
      .get(apiURL)
      .then((response) => {
      	const dates = response.data.data;
        // Extracting the first 'long' date from the API response
        const randomDate = dates[Object.keys(dates)[0]].long;

        // Chosen at random
        const randomIndex = Math.floor(Math.random() * responseTemplates.length);
        const responseTemplate = responseTemplates[randomIndex];

        // Appending both strings together
        agent.add(`${responseTemplate} ${randomDate}`);
      })
      .catch((error) => {
        console.error('Error fetching random date:', error);
        agent.add(`Sorry, there was an error while fetching the last filled date. Please try again later.`);
      });
  }
  
/**********************************************
	RETURN-A-LIST-OF-PRESCRIPTIONS FUNCTION
 **********************************************/
  function prescripList(agent) {
    // I couldn't find any other way to call the saved Entity data via the inline editor!
    const allPrescriptions = [
      'Aspirin',
      'Advil',
      'Tylenol',
      'Lipitor',
      'Nexium',
      'Synthroid',
      'Zocor',
      'Plavix',
      'Singulair',
      'Crestor',
      'Ventolin',
      'Prozac',
      'Zoloft',
      'Celebrex',
      'Abilify',
      'Seroquel',
      'Prilosec',
      'Lexapro',
      'Diovan',
      'Cymbalta',
      'Lyrica',
      'Prevacid',
      'Cipro',
      'Amoxil',
      'Zithromax',
      'Augmentin',
      'Ambien',
      'Xanax',
      'Percocet',
      'Vicodin',
      'Adderall',
      'Ritalin',
      'Viagra',
      'Cialis',
      'Levitra',
      'Advair',
      'Flovent',
      'Spiriva',
      'Symbicort',
      'Lantus',
      'Humalog',
      'Januvia',
      'Crestor',
      'Vytorin',
      'Neurontin',
      'Wellbutrin',
      'Effexor',
      'Proventil',
      'Nasonex',
      'Benicar',
    ];
	const responseTemplates = [
    	"It looks like you're currently prescribed:",
    	"Right now, you're currently prescribed:",
    	"It looks like your prescriber currently has you taking:",
    	"We have you as currently taking:",
  	];

  	try {
      	// Chosen at random
    	const randomIndex = Math.floor(Math.random() * responseTemplates.length);
    	const responseTemplate = responseTemplates[randomIndex];
    	// This is an arbitrary placeholder value, but it selects no more than 5 prescriptions at random from the list
    	const maxPrescriptionsToShow = Math.min(5, allPrescriptions.length);
    	const selectedPrescriptions = [];
      
    	for (let i = 0; i < maxPrescriptionsToShow; i++) {
      		const randomIndex = Math.floor(Math.random() * allPrescriptions.length);
      		selectedPrescriptions.push(allPrescriptions[randomIndex]);
      		allPrescriptions.splice(randomIndex, 1);
    	}
    	const prescriptionList = selectedPrescriptions.join(', ');
    	// returns the appended (random) template + medications 
      	agent.add(`${responseTemplate} ${prescriptionList}`);
      
  	} catch (error) {
    	console.error('Error fetching prescription list:', error);
    	agent.add(`Sorry, there was an error while fetching the prescription list! Please try again later!`);
  	}
  }

/**********************************************
	WHEN-CAN-PRESCRIPTION-BE-FILLED FUNCTION
 **********************************************/
  function whenCanPrescripBeFilled(agent) {
    const medicationName = agent.parameters.MedicationName;
    // Array to be chosen at random
	const responseTemplates = [
    	'Of course, your $MedicationName can next be refilled',
    	'Sure, your $MedicationName is eligible to be refilled',
    	'You bet, your $MedicationName can next be refilled',
    	'Your $MedicationName can be refilled',
  	];
  	// Placeholder dates, i'd imagine this data would normally be filled by a multi-modal app of sorts
    const responseEndings = [
    	' on August 30th, 2023. What else can I assist with?',
    	' on November 21st, 2023. Can I help by answering anything else for you?',
    	' on a date that was prior to today. It is presently available for refill. Is there anything else I can do for you?',
  	];

  	try {
    	const randomResponseIndex = Math.floor(Math.random() * responseTemplates.length);
    	const randomDateIndex = Math.floor(Math.random() * responseEndings.length);
    	const responseTemplate = responseTemplates[randomResponseIndex].replace('$MedicationName', medicationName);
    	const responseEnding = responseEndings[randomDateIndex];

      	// FINAL RESPONSE
    	agent.add(`${responseTemplate} ${responseEnding}`);
  	} catch (error) {
    	console.error('Error fetching prescription information!', error);
    	agent.add(`Sorry, there was an error while fetching prescription information. Please try again later!`);
  	}
  }
  
/**********************************************
    WHICH-PRESCRIBER-PRESCRIBED FUNCTION
**********************************************/
  function whichPrescriber() {
    const medicationName = agent.parameters.MedicationName;
    const apiURL = 'https://npiregistry.cms.hhs.gov/api/?version=2.1&city=portland';

    return axios
      .get(apiURL)
      .then((response) => {
        const providers = response.data.results;
        const selectedProvider = providers[Math.floor(Math.random() * providers.length)];

        const firstName = selectedProvider.basic.first_name || selectedProvider.basic.authorized_official_first_name;
        const lastName = selectedProvider.basic.last_name || selectedProvider.basic.authorized_official_last_name;
        const organization = selectedProvider.basic.organization_name;
        const address = selectedProvider.addresses[0].address_1;
        const phoneNumber = selectedProvider.addresses[0].telephone_number;

        const responseTemplates = [
          "I found their information. It looks like your prescriber for your $MedicationName is: $ProviderInfo. Was there anything else I can assist with?",
          "I found it! The prescribers information for your $MedicationName prescription is: $ProviderInfo. What else can I help with?",
          "Got it. The prescriber who prescribed your $MedicationName is: $ProviderInfo. Can I help in any other way?",
          "Of course, your prescriber for your $MedicationName prescription is: $ProviderInfo. Did you need me to look up anything else?",
        ];

        const randomIndex = Math.floor(Math.random() * responseTemplates.length);
        const responseTemplate = responseTemplates[randomIndex].replace('$MedicationName', medicationName);

      let providerInfo = '';
      if (firstName && lastName) {
        providerInfo = `${firstName} ${lastName}`;
      } else {
        providerInfo = 'Urgent care attending physician';
      }

      if (organization) {
      	providerInfo += `, from ${organization}`;
      }
      
      if (address) {
        providerInfo += `, located at ${address}`;
      }

      if (phoneNumber) {
        providerInfo += `, phone: ${phoneNumber}`;
      }

      const fullResponse = responseTemplate.replace('$ProviderInfo', providerInfo);

        agent.add(fullResponse);
      })
      .catch((error) => {
        console.error('Error fetching provider information:', error);
        agent.add(`Sorry, there was an error while fetching the provider information. Please try again later.`);
      });
}

  // // Uncomment and edit to make your own intent handler
  // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function yourFunctionHandler(agent) {
  //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
  //   agent.add(new Card({
  //       title: `Title: this is a card title`,
  //       imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
  //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
  //       buttonText: 'This is a button',
  //       buttonUrl: 'https://assistant.google.com/'
  //     })
  //   );
  //   agent.add(new Suggestion(`Quick Reply`));
  //   agent.add(new Suggestion(`Suggestion`));
  //   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
  // }

  // // Uncomment and edit to make your own Google Assistant intent handler
  // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function googleAssistantHandler(agent) {
  //   let conv = agent.conv(); // Get Actions on Google library conv instance
  //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
  //   agent.add(conv); // Add Actions on Google library responses to your agent's response
  // }
  // // See https://github.com/dialogflow/fulfillment-actions-library-nodejs
  // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('FindPharmacyIntent', findPharmacy);
  intentMap.set('PrescriptionLastFilledIntent', prescripLastFilled);
  intentMap.set('PrescriptionListIntent', prescripList);
  intentMap.set('WhenCanPrescriptionBeFilledIntent', whenCanPrescripBeFilled);
  intentMap.set('WhichDoctorPrescribedIntent', whichPrescriber);

  // intentMap.set('your intent name here', yourFunctionHandler);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});
