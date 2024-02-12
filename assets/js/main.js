console.log("Welcome to Alpha Chats Space");


/** ############################
 * ----------Components---------
 * ############################ */

const WelcomeSection = document.getElementById("welcome-section");
const ChatsSection = document.getElementById("chats-section");



const UsernameInputBox = document.getElementById("input-box-username");


/** ############################
 * ----------Varaiables---------
 * ############################ */
const APIURL = "https://api.alphaspace.in";


let username = localStorage.getItem("username");
let userinfo = JSON.parse(localStorage.getItem("userinfo")) || {};


// helps in making user join the chat
async function _joinChat() {
    username = UsernameInputBox.value;
    setLocalValue("username", username);

    const resp = await apiHandler("api/v1/user/authenticate", "post", { username: username });
    console.log(resp);

    if (resp.status === 200) {

        localStorage.setItem("access", resp.data.accessToken);
        localStorage.setItem("refresh", resp.data.refreshToken);

        delete resp.data.accessToken;
        delete resp.data.refreshToken;
        userinfo = resp.data;
        setLocalValue("userinfo", JSON.stringify(resp.data));
        _renderPage();
    }
}

function _route(to) {
    console.log("Called me");
    window.location.hash = to;
    _renderPage();
}

function _logout() {
    localStorage.clear();
    username = "";
    _renderPage();
}

// render the page 
async function _renderPage() {
    var hash = window.location.hash.substring(1);

    WelcomeSection.style.display = "none";
    ChatsSection.style.display = "none";

    if (hash.includes("/chats") && username) {
        ChatsSection.style.display = "inherit";
        _activeSideMenuItem("chats");
    } else if (hash.includes("/mails") && username) {
        window.location.hash = "/mails";
        ChatsSection.style.display = "inherit";
        _activeSideMenuItem("mails");
    } else if (hash.includes("/settings") && username) {
        window.location.hash = "/settings";
        ChatsSection.style.display = "inherit";
        _activeSideMenuItem("settings");
    } else if (hash.includes("/more") && username) {
        window.location.hash = "/more";
        ChatsSection.style.display = "inherit";
        _activeSideMenuItem("more");
    } else if (username) {
        window.location.hash = "/chats";
        ChatsSection.style.display = "inherit";
        _activeSideMenuItem("chats");
    } else {
        window.location.hash = "";
        WelcomeSection.style.display = "inherit";
    }
}
_renderPage();

function _activeSideMenuItem(item) {
    console.log("Item", document.getElementsByClassName("side-menu-item"));
    document.querySelectorAll(".side-menu-item").forEach(element => {
        element.classList.remove('active-side-menu-item');
    });
    document.getElementById("router-link-" + item).classList.add("active-side-menu-item");
}

/** ############################
 * ------Helper Functions------
 * ############################ */

// to validate input field of username
function validateUsername(input) {
    var regex = /^[a-zA-Z0-9-_]*$/;
    input.value = input.value.replace(/\s+/g, '-');
    if (!regex.test(input.value)) {
        input.value = input.value.replace(/[^a-zA-Z0-9-_]/g, '');
    }
}

// set localStorage value
function setLocalValue(name, value) {
    localStorage.setItem(name, value);
}

// Api Request Handler

async function apiHandler(path, method, payload) {
    const apiUrl = APIURL; // Replace with your API base URL

    const requestOptions = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("access")}`
        },
        body: JSON.stringify(payload),
    };

    try {
        const response = await fetch(`${apiUrl}/${path}`, requestOptions);
        const data = await response.json();

        // Handle response based on your needs
        if (response.ok) {
            console.log(`API request successful: ${method} ${path}`);
            return data;
        } else {
            console.error(`API request failed: ${method} ${path}`, data);
            throw new Error(`API request failed: ${method} ${path}`);
        }
    } catch (error) {
        console.error('Error during API request:', error.message);
        throw new Error('Error during API request');
    }
}