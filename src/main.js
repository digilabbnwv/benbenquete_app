import './style.css';

// --- Configuration & State ---
const CONFIG_URL = '/config/boekjes-en-babbels.v1.json';
const STORAGE_KEY = 'beb_survey_v1';
const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';
const API_URL = import.meta.env.VITE_API_BASE_URL || '/api/submit';

let state = {
    step: 'LOADING', // LOADING, INTRO, QUESTION, SUBMITTING, SUCCESS, ERROR
    questionIndex: 0,
    answers: {},
    config: null,
    token: null,
    sessionId: crypto.randomUUID(),
    startTime: new Date().toISOString(),
};

// --- DOM Elements ---
const app = document.getElementById('app');
const errorToast = document.getElementById('error-toast');
const errorMsg = document.getElementById('error-msg');

// --- Initialization ---
async function init() {
    // Parse URL params
    const urlParams = new URLSearchParams(window.location.search);
    state.token = urlParams.get('t');

    // Load Config
    try {
        const response = await fetch(CONFIG_URL);
        if (!response.ok) throw new Error('Kon configuratie niet laden');
        state.config = await response.json();
    } catch (error) {
        showError('Fout bij laden enquête. Probeer het later opnieuw.');
        return;
    }

    // Check LocalStorage (Soft Dedupe)
    const previousSubmission = localStorage.getItem(STORAGE_KEY);
    if (previousSubmission && !urlParams.has('force')) {
        const data = JSON.parse(previousSubmission);
        // Simple check if it was recent/same version
        if (data.version === state.config.version) {
            state.step = 'ALREADY_COMPLETED';
            render();
            return;
        }
    }

    // Start
    state.step = 'INTRO';
    render();
}

// --- Render Logic ---
function render() {
    app.innerHTML = '';
    window.scrollTo(0, 0);

    switch (state.step) {
        case 'LOADING':
            app.innerHTML = '<div class="text-center text-slate-500">Laden...</div>';
            break;
        case 'INTRO':
            renderIntro();
            break;
        case 'ALREADY_COMPLETED':
            renderAlreadyCompleted();
            break;
        case 'QUESTION':
            renderQuestion();
            break;
        case 'SUBMITTING':
            app.innerHTML = `
          <div class="flex flex-col items-center justify-center h-64">
            <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-[#FF006E]"></div>
            <p class="mt-4 text-slate-600 font-medium">Even geduld, we versturen je antwoorden...</p>
          </div>`;
            break;
        case 'SUCCESS':
            renderSuccess();
            break;
        case 'ERROR':
            app.innerHTML = `
        <div class="bg-red-50 p-6 rounded-2xl border border-red-100 text-center">
            <h2 class="text-xl font-bold text-red-600 mb-2">Oeps!</h2>
            <p class="text-slate-700 mb-4">Er ging iets mis bij het versturen.</p>
            <button class="btn-primary" onclick="window.location.reload()">Probeer opnieuw</button>
        </div>`;
            break;
    }
}

function renderIntro() {
    const container = document.createElement('div');
    container.className = 'flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in duration-500';

    container.innerHTML = `
    <div class="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md mx-auto relative overflow-hidden">
      <!-- Decorative circles -->
      <div class="absolute -top-10 -right-10 w-24 h-24 bg-[#ADE8F4] rounded-full opacity-50"></div>
      <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-[#CAF0F8] rounded-full opacity-50"></div>
      
      <h1 class="text-3xl font-display font-bold text-[#03045E] mb-4 relative z-10">${state.config.title}</h1>
      <p class="text-lg text-slate-600 mb-8 relative z-10 leading-relaxed">
        ${state.config.introText}
      </p>
      <button id="start-btn" class="btn-primary w-full relative z-10">
        Start Enquête
      </button>
    </div>
  `;

    app.appendChild(container);
    document.getElementById('start-btn').addEventListener('click', () => {
        state.step = 'QUESTION';
        state.questionIndex = 0;
        render();
    });
}

function renderAlreadyCompleted() {
    const container = document.createElement('div');
    container.className = 'bg-white p-8 rounded-3xl shadow-xl w-full max-w-md mx-auto text-center space-y-4';
    container.innerHTML = `
        <h2 class="text-2xl font-bold text-[#03045E]">Al ingevuld!</h2>
        <p class="text-slate-600">Je hebt deze enquête al eerder ingevuld. Bedankt daarvoor!</p>
        <div class="pt-4">
            <button id="restart-btn" class="btn-secondary w-full">Toch opnieuw invullen</button>
        </div>
    `;
    app.appendChild(container);
    document.getElementById('restart-btn').addEventListener('click', () => {
        state.step = 'INTRO'; // Or directly QUESTION
        state.answers = {};
        render();
    });
}

function renderQuestion() {
    const question = state.config.questions[state.questionIndex];
    const totalQuestions = state.config.questions.length;
    const progress = ((state.questionIndex) / totalQuestions) * 100;

    const container = document.createElement('div');
    container.className = 'w-full max-w-lg mx-auto pb-4 animate-in slide-in-from-right duration-300';

    // Progress bar
    const progressHtml = `
    <div class="mb-6 px-2">
      <div class="flex justify-between text-xs font-semibold text-[#0077B6] mb-2 uppercase tracking-wide">
        <span>Vraag ${state.questionIndex + 1} van ${totalQuestions}</span>
        <span>${Math.round(progress)}%</span>
      </div>
      <div class="w-full bg-[#ADE8F4] rounded-full h-2.5 overflow-hidden">
        <div class="bg-[#00B4D8] h-2.5 rounded-full transition-all duration-500 ease-out" style="width: ${progress}%"></div>
      </div>
    </div>
  `;

    // Question Card
    const card = document.createElement('div');
    card.className = 'bg-white rounded-3xl shadow-lg p-6 md:p-8 relative';

    card.innerHTML = `
    <h2 class="text-2xl font-display font-bold text-[#03045E] mb-6 leading-tight">${question.text}</h2>
    <div id="options-container" class="space-y-3 mb-8"></div>
    <div class="flex justify-between items-center pt-4 border-t border-slate-100">
       ${state.questionIndex > 0 ? `<button id="prev-btn" class="text-slate-400 hover:text-[#0077B6] font-medium px-4 py-2 transition-colors">← Terug</button>` : '<div></div>'}
       <button id="next-btn" class="btn-primary px-8">${state.questionIndex === totalQuestions - 1 ? 'Versturen' : 'Volgende'}</button>
    </div>
  `;

    container.innerHTML = progressHtml;
    container.appendChild(card);
    app.appendChild(container);

    // Render Options
    const optionsContainer = card.querySelector('#options-container');

    if (question.type === 'text') {
        const textarea = document.createElement('textarea');
        textarea.className = "w-full border-2 border-slate-200 rounded-xl p-4 focus:outline-none focus:border-[#00B4D8] transition-colors min-h-[120px] text-lg";
        textarea.placeholder = "Typ hier je antwoord...";
        textarea.value = state.answers[question.id] || '';
        textarea.addEventListener('input', (e) => {
            state.answers[question.id] = e.target.value;
        });
        optionsContainer.appendChild(textarea);
    } else {
        question.options.forEach(opt => {
            const isMulti = question.type === 'multi-select';
            const wrapper = document.createElement('label');

            // Check if selected
            let isSelected = false;
            let currentVal = state.answers[question.id];
            if (isMulti) {
                // Multi: currentVal is array or semicolon string. Let's use array internally, convert later.
                if (!Array.isArray(currentVal)) currentVal = currentVal ? currentVal.split(';') : [];
                isSelected = currentVal.includes(opt.value);
            } else {
                isSelected = currentVal === opt.value;
            }

            wrapper.className = `option-card group ${isSelected ? 'selected ring-2 ring-[#00B4D8] ring-opacity-50' : ''}`;

            const inputType = isMulti ? 'checkbox' : 'radio';

            let innerHTML = `
           <div class="flex items-center w-full cursror-pointer">
             <input type="${inputType}" name="${question.id}" value="${opt.value}" class="peer hidden" ${isSelected ? 'checked' : ''}>
             <div class="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center mr-3 peer-checked:bg-[#FF006E] peer-checked:border-[#FF006E] transition-all">
                <svg class="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
             </div>
             <span class="text-lg font-medium text-slate-700 group-hover:text-[#03045E] flex-1">${opt.label}</span>
           </div>
         `;

            // Helper Logic for "Anders" input
            if (opt.hasInput) {
                innerHTML += `
               <div id="anders-input-${opt.value}" class="w-full mt-3 ${isSelected ? 'block' : 'hidden'} pl-9">
                 <input type="text" placeholder="Namelijk..." class="text-input" value="${state.answers[question.id + '_anders'] || ''}">
               </div>
             `;
            }

            wrapper.innerHTML = innerHTML;
            optionsContainer.appendChild(wrapper);

            // Event Listeners
            const input = wrapper.querySelector('input');
            input.addEventListener('change', () => handleOptionChange(question, opt, input.checked, wrapper));

            if (opt.hasInput) {
                const textInput = wrapper.querySelector('input[type="text"]');
                textInput.addEventListener('click', (e) => e.preventDefault()); // prevent label toggle
                textInput.addEventListener('input', (e) => {
                    state.answers[question.id + '_anders'] = e.target.value;
                });
            }
        });
    }

    // Navigation Listeners
    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => {
        state.questionIndex--;
        render();
    });

    const nextBtn = document.getElementById('next-btn');
    nextBtn.addEventListener('click', () => {
        if (validateCurrentQuestion()) {
            if (state.questionIndex < totalQuestions - 1) {
                state.questionIndex++;
                render();
            } else {
                handleSubmit();
            }
        }
    });
}

function handleOptionChange(question, option, isChecked, wrapperFn) {
    const isMulti = question.type === 'multi-select';
    let currentVal = state.answers[question.id];

    if (isMulti) {
        if (!Array.isArray(currentVal)) currentVal = currentVal ? currentVal.split(';') : [];
        if (isChecked) {
            if (!currentVal.includes(option.value)) currentVal.push(option.value);
        } else {
            currentVal = currentVal.filter(v => v !== option.value);
        }
        state.answers[question.id] = currentVal;
    } else {
        state.answers[question.id] = option.value;
    }

    // Re-render essentially to update classes, but that's heavy. Better update DOM manually.
    // Update classes for all siblings if radio
    if (!isMulti) {
        const siblings = wrapperFn.parentElement.querySelectorAll('.option-card');
        siblings.forEach(el => {
            el.classList.remove('selected', 'ring-2', 'ring-[#00B4D8]', 'ring-opacity-50');
            const andersInput = el.querySelector('input[type="text"]');
            if (andersInput && andersInput.parentElement) andersInput.parentElement.classList.add('hidden');
        });
    }

    // Toggle self
    if (isChecked) {
        wrapperFn.classList.add('selected', 'ring-2', 'ring-[#00B4D8]', 'ring-opacity-50');
    } else {
        wrapperFn.classList.remove('selected', 'ring-2', 'ring-[#00B4D8]', 'ring-opacity-50');
    }

    // Toggle Anders Input
    if (option.hasInput) {
        const inputContainer = wrapperFn.querySelector(`#anders-input-${option.value}`);
        if (inputContainer) {
            if (isChecked) {
                inputContainer.classList.remove('hidden');
                // Focus logic
                setTimeout(() => inputContainer.querySelector('input').focus(), 100);
            } else {
                inputContainer.classList.add('hidden');
            }
        }
    }
}


function validateCurrentQuestion() {
    const question = state.config.questions[state.questionIndex];
    if (!question.required) return true;

    const answer = state.answers[question.id];
    let isValid = false;

    if (question.type === 'multi-select') {
        isValid = Array.isArray(answer) && answer.length > 0;
    } else if (question.type === 'single-select') {
        isValid = !!answer;
    } else if (question.type === 'text') {
        isValid = answer && answer.trim().length > 0; // If text is required
    } else {
        isValid = true;
    }

    // Special check for "Anders" if required and selected? 
    // Usually if "Anders" is checked, describing it is good practice but maybe not strictly enforced by code unless requested.
    // User requirement: "Anders, namelijk..." input fields only appear when "Anders" is selected.
    // If "Anders" is selected, the input is visible. The internal answer object captures the text in `q_id_anders`.
    // Let's assume the text input itself isn't strictly blocking unless the user specified "required" on it, which isn't in JSON schema explicitly.
    // But logically if you pick "Other" you should specify. I'll leave it loose for now to avoid frustration.

    if (!isValid) {
        showError('Dit veld is verplicht. Maak een keuze of vul iets in.');
        return false;
    }
    return true;
}

function showError(msg) {
    errorMsg.innerText = msg;
    errorToast.classList.remove('hidden');
    errorToast.classList.remove('translate-y-[-100%]');
    setTimeout(() => {
        errorToast.classList.add('hidden');
    }, 4000);
}

async function handleSubmit() {
    state.step = 'SUBMITTING';
    render();

    // Prepare Payload
    const payload = {
        surveyId: state.config.surveyId,
        version: state.config.version,
        submittedAt: new Date().toISOString(),
        sessionId: state.sessionId,
        qrToken: state.token || 'NO_TOKEN',
        meta: {
            userAgent: navigator.userAgent,
            lang: navigator.language
        },
        answersJson: JSON.stringify(state.answers)
    };

    // Flatten answers
    state.config.questions.forEach(q => {
        let val = state.answers[q.id];
        if (Array.isArray(val)) val = val.join(';');
        payload[q.id] = val || ''; // Ensure explicit empty string for Lists

        // Handle anders
        const andersVal = state.answers[q.id + '_anders'];
        if (andersVal !== undefined) {
            payload[q.id + '_anders'] = andersVal;
        }
    });

    console.log('Submitting Payload:', payload);

    // Honeypot (bot_check)
    payload.bot_check = ''; // Should be empty. If filled by bot, worker rejects.

    if (MOCK_MODE) {
        // Mock specific behavior
        await new Promise(r => setTimeout(r, 1500));
        console.log('--- MOCK SUBMISSION SUCCESS ---');
        console.log('Payload:', payload);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        state.step = 'SUCCESS';
        render();
        return;
    }

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Client-Secret': import.meta.env.VITE_CLIENT_SECRET || ''
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Server rejected');
        }

        // Success
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        state.step = 'SUCCESS';
        render();

    } catch (e) {
        console.error(e);
        state.step = 'ERROR';
        render();
    }
}

function renderSuccess() {
    app.innerHTML = `
      <div class="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in zoom-in duration-500">
        <div class="bg-white p-10 rounded-[3rem] shadow-xl w-full max-w-sm mx-auto relative overflow-hidden">
           <div class="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
           </div>
           
           <h1 class="text-3xl font-display font-bold text-[#03045E] mb-4">Dankjewel!</h1>
           <p class="text-slate-600 text-lg">Je antwoorden zijn verstuurd. Bedankt voor je hulp!</p>
           
           <div class="mt-8">
             <a href="https://bibliotheeknoordwestveluwe.nl" class="btn-secondary inline-block">Naar de website</a>
           </div>
        </div>
      </div>
    `;
}

// Start
init();
