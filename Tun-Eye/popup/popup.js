const content = document.querySelector('.content');
const body = document.querySelector('body');
const mainInterface = document.querySelector('#main-interface');
const settingsInterface = document.querySelector('#settings-interface');
const breakdownInterface = document.querySelector('#breakdown-interface');
const submitBtn = document.querySelector('#submit');

// Load preview to user
chrome.storage.local.get(null).then(res => {
    switch (res.type) {
        case 'text':
            content.textContent = res.value;
            break;
        case 'image':
            content.innerHTML = `
                <img src="${res.value}" style="object-fit:contain; width:100%; height: 100%; display:block;" />
            `;
            break;
        default:
            content.textContent = 'Error: Invalid type';
            break;
    }

    // Set default behavior for extension
    if (!('enableExtension' in res)) {
        chrome.storage.local.set({
            ...res,
            'enableExtension': true
        })
    }

    // To respect user privacy and choice, set enableRecord to false
    if (!('enableRecord' in res)) {
        chrome.storage.local.set({
            ...res,
            'enableExtension': false
        })
    }

    // Disable submission if enableExtension is set to false
    if ('enableExtension' in res && res.enableExtension === false) {
        submitBtn.classList.add('submit-disabled', 'disabled');
        submitBtn.disabled = true;
    }

    // Listen to chrome storage changes to modify submitBtn
    chrome.storage.onChanged.addListener((changes, namespace) => {
        for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
            if (namespace === "local" && key == 'enableExtension' && newValue === true) {
                submitBtn.classList.remove('submit-disabled', 'disabled');
                submitBtn.disabled = false;
            } else if (namespace === "local" && key == 'enableExtension' && newValue === false) {
                submitBtn.classList.add('submit-disabled', 'disabled');
                submitBtn.disabled = true;
            }
        }
    })

    // Submit data on click
    submitBtn.addEventListener('click', (e) => {
        const scanStep = document.querySelector('.default');
        const answerBtn = document.querySelector('.answer');
        const circleSym = document.querySelector('.symbol');

        e.currentTarget.classList.add("hidden");
        scanStep.classList.remove("hidden");
        answerBtn.classList.add('hidden');

        // Call flask API
        fetch("http://127.0.0.1:1234/api/process", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(res)
        })
            .then(res => {
                return res.json();
            })
            .then(output => {
                console.log(output);

                scanStep.classList.add("hidden");
                answerBtn.classList.remove('hidden');
                answerBtn.childNodes[1].childNodes[2].textContent = output['verdict'];

                // Change symbol color
                if (output['verdict'] === "Fake") {
                    circleSym.style.backgroundColor = "#F7BF2D";
                } else if (output['verdict'] === "Real") {
                    circleSym.style.backgroundColor = "#035EE6";
                }
            })
            .catch(err => {
                console.error(`Error encountered:\n------------------------------\n${err}`)
            })
    })
})


// Settings interface
const enableExtension = document.querySelector('#enable-extension');
const enableRecord = document.querySelector('#enable-record');
const doneBtn = document.querySelector('.done');
document.querySelectorAll('.settings').forEach(settings => {
    settings.addEventListener('click', () => {
        body.style.backgroundColor = "#2D2D51";
        mainInterface.classList.add('hidden');
        breakdownInterface.classList.add('hidden');
        settingsInterface.classList.remove('hidden');

        // Apply previous user settings
        chrome.storage.local.get(null)
            .then(res => {
                enableExtension.checked = !!res.enableExtension;
                enableRecord.checked = !!res.enableRecord;

                // Return to main interface from settings
                doneBtn.addEventListener('click', () => {
                    chrome.storage.local.set({
                        ...res,
                        "enableExtension": enableExtension.checked,
                        "enableRecord": enableRecord.checked
                    })

                    mainInterface.classList.remove('hidden');
                    settingsInterface.classList.add('hidden');
                    breakdownInterface.classList.add('hidden');

                    body.style.backgroundColor = "#039BE6";
                })
            })
    })
})

