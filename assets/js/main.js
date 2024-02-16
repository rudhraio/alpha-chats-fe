console.log("Welcome to Alpha Chats Space");


/** ############################
 * ----------Components---------
 * ############################ */

const WelcomeSection = document.getElementById("welcome-section");
const UserSection = document.getElementById("user-section");


const ChatsSection = document.getElementById("chats-section");
const MailsSection = document.getElementById("mails-section");
const MoreSection = document.getElementById("more-section");
const SettingsSection = document.getElementById("settings-section");

const UserChatItems = document.getElementById("user-chat-list");
const SelectedUserTitleCard = document.getElementById("selected-user-title-card");
const SelectedUserConversation = document.getElementById("selected-user-conversation");
const LoggedUserCard = document.getElementById("logged-user-card");


const UsernameInputBox = document.getElementById("input-box-username");
const MessageBox = document.getElementById("message-box");




/** ############################
 * ----------Varaiables---------
 * ############################ */
// const APIURL = "https://api.alphaspace.in";
const APIURL = "http://localhost:3200";
const SOCKETURL = "wss://socket.alphaspace.in";


let username = localStorage.getItem("username");
let userinfo = JSON.parse(localStorage.getItem("userinfo")) || {};
let memberslist = [], chatsList = [];
let socket, selectedOption = "chats", selectedItem = "", selectedItemData = {};

if (userinfo) {
    _renderLoggedUserCard(userinfo);
}

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
        _renderLoggedUserCard(resp.data);
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
    socket.close();
    username = "";
    _renderPage();
}

// render the page 
async function _renderPage() {
    var hash = window.location.hash.substring(1);

    WelcomeSection.style.display = "none";
    UserSection.style.display = "none";

    if (hash.includes("/chats") && username) {
        UserSection.style.display = "inherit";
        _activeSideMenuItem("chats");
        _renderMyChatMessages();
    } else if (hash.includes("/mails") && username) {
        window.location.hash = "/mails";
        UserSection.style.display = "inherit";
        _activeSideMenuItem("mails");
    } else if (hash.includes("/settings") && username) {
        window.location.hash = "/settings";
        UserSection.style.display = "inherit";
        _activeSideMenuItem("settings");
    } else if (hash.includes("/more") && username) {
        window.location.hash = "/more";
        UserSection.style.display = "inherit";
        _activeSideMenuItem("more");
    } else if (username) {
        window.location.hash = "/chats";
        UserSection.style.display = "inherit";
        _activeSideMenuItem("chats");
        _renderMyChatMessages();
    } else {
        window.location.hash = "";
        WelcomeSection.style.display = "inherit";
    }

    if (localStorage.getItem("access")) {
        _conectToSocket();
    }
}
_renderPage();

function _activeSideMenuItem(item) {
    document.querySelectorAll(".side-menu-item").forEach(element => {
        element.classList.remove('active-side-menu-item');
    });
    document.querySelectorAll(".menu-sections").forEach(element => {
        element.classList.add("hidden");
    })
    document.getElementById(item + "-section").classList.remove("hidden");

    document.getElementById("router-link-" + item).classList.add("active-side-menu-item");
}


function _conectToSocket() {
    socket = new WebSocket(`${SOCKETURL}/?token=${localStorage.getItem("access")}`);


    socket.onopen = function (event) {
        console.log('WebSocket connection opened.');
    };

    // Event handler function for when a message is received
    socket.onmessage = function (event) {
        console.log('Message from server:', event.data);
    };

    // Event handler function for when the WebSocket connection is closed
    socket.onclose = function (event) {
        console.log('WebSocket connection closed.');
    };
}

async function _onChannelSelection(event) {
    selectedOption = event.value;
    selectedItem = "";
    window.location.hash = `/chats/?selectedOption=${selectedOption}`;

    if (event.value === "members") {
        _renderMemberList();
    } else if (event.value === "chats") {
        _renderMyChatMessages();
    }


}

async function _renderMemberList() {
    const tempItems = await _getMembersList();
    let tempInnerHtml = "";
    tempItems.forEach((item) => {
        if (item.username !== username) {

            tempInnerHtml += _memberHtmlComponent(item);
        }
    });
    UserChatItems.innerHTML = tempInnerHtml;
}

async function _renderMyChatMessages() {
    const tempItems = await _getChatsList();
    let tempInnerHtml = "";
    tempItems.forEach((item) => {
        tempInnerHtml += _chatItemHtmlComponent(item);
    });
    UserChatItems.innerHTML = tempInnerHtml;
}

async function _getMembersList() {
    const { data } = await apiHandler("api/v1/members/get", "get");
    memberslist = data;
    return memberslist;
}


async function _getChatsList() {
    const { data } = await apiHandler("api/v1/chats/get", "get");
    chatsList = data;
    return chatsList;
}


async function _onChatSelection(id) {
    console.log("Id", id);
    window.location.hash = `/chats/?selectedOption=${selectedOption}&selectedItem=${id}`;

    selectedItem = id;

    document.querySelectorAll(".user-chat-item").forEach((item) => {
        item.classList.remove("bg-gray-500", "text-white");
        item.classList.add("bg-gray-100", "text-black")
    });
    const tempComponent = document.getElementById(`user-${id}`);

    tempComponent.classList.add("bg-gray-500", "text-white")
    tempComponent.classList.remove("bg-gray-100", "text-black");


    console.log("selectedOption", selectedOption);

    if (selectedOption === "members") {
        selectedItemData = memberslist.filter((item) => { return item.id === id })[0];
    } else if (selectedOption === "chats") {
        const tempdata = chatsList.filter((item) => { return item.userslist.includes(id) })[0];
        console.log(tempdata);
        selectedItemData = tempdata.usersdetails.filter((item) => { return item.username !== username })[0];
    }


    SelectedUserTitleCard.innerHTML = _selectedUserTitleComponent(selectedItemData);



    _renderChatMessages(id);
}


async function _renderChatMessages(id) {
    const data = await _getMessagesByUserId(id);

    let conversationInnerhtml = "";
    data.messages.forEach((item) => {
        conversationInnerhtml += _userMessageComponent(item, data.usersdetails)
    });

    SelectedUserConversation.innerHTML = conversationInnerhtml;
}


async function _getMessagesByUserId(id) {
    const { data } = await apiHandler(`api/v1/chats/get/?userid=${id}`, "get");
    return data;
}

async function _sendMessage() {
    const message = MessageBox.value;

    const { data } = await apiHandler("api/v1/chats/post", "post", { message, to: selectedItem });
    _renderChatMessages(selectedItem);

    MessageBox.value = "";

}

async function _renderLoggedUserCard(data) {
    LoggedUserCard.innerHTML = _loggedUserCardComponent(data);
}


function _memberHtmlComponent(data) {
    const { id, username, userstatus } = data;

    return `<div id="user-${id}" class="flex items-center bg-gray-100 gap-x-3 w-full
        rounded-2xl px-5 py-3 cursor-pointer user-chat-item" onclick="_onChatSelection('${id}')">
        <div class="w-10 h-10 bg-[${uuidToHexColor(id)}] rounded-full 
            relative flex justify-center items-center text-xl text-white uppercase">
            ${username[0]}
            <div class="w-3 h-3 rounded-full ${userstatus === "online" ? "bg-green-500" : "bg-gray-400"} absolute bottom-0 right-0">
            </div>
        </div>
        <div>
            <p class="font-bold">
                #${username}
            </p>
            <p class="text-sm">
                ${userstatus}
            </p>
        </div>
    </div>`
}


function _chatItemHtmlComponent(data) {


    const user = data?.usersdetails?.filter((item) => { return item.username !== username })[0];
    const loggedinuser = data?.usersdetails?.filter((item) => { return item.username === username })[0];

    return `<div id="user-${user?.id}" class="flex items-center bg-gray-100 gap-x-3 w-full
        rounded-2xl px-5 py-3 cursor-pointer user-chat-item" onclick="_onChatSelection('${user?.id}')">
        <div class="min-w-10 min-h-10 bg-[${uuidToHexColor(user?.id)}] rounded-full 
            relative flex justify-center items-center text-xl text-white uppercase">
            ${user?.username[0]}
            <div class="w-3 h-3 rounded-full bg-gray-400 absolute bottom-0 right-0">
            </div>
        </div>
        <div class="w-full">
            <p class="flex justify-between font-medium items-center">
                    <span>
                    #${user?.username}
                    </span>
                    <span class="text-xs">
                        ${new Date(data.createdat).toLocaleTimeString()} - ${new Date(data.createdat).toLocaleDateString()}
                    </span>
                </p>

            <p class="text-sm flex justify-between w-full font-medium items-center mt-1">
                <span>
                    ${data?.last_message}
                </span>
                ${loggedinuser.unread === "true" ? '<span class="flex justify-center items-center rounded-full text-xs bg-black text-white w-3 h-3"></span>' : ''}
                
            </p>
        </div>
    </div>`
}

function _selectedUserTitleComponent(data) {

    console.log("data", data);
    const { id, username, userstatus } = data;
    console.log(data);
    return `<div class="min-w-12 min-h-12 bg-[${uuidToHexColor(id)}] rounded-full 
                relative flex justify-center items-center text-2xl uppercase text-white">
                ${username[0]}
                <div class="w-4 h-4 rounded-full ${userstatus === "online" ? "bg-green-500" : "bg-gra-400"} absolute bottom-0 right-0 cursor-pointer">
                </div>
            </div>
            <div class="w-full">
                <p class="flex justify-between font-medium items-center text-xl">
                    #${username}
                </p>
                ${userstatus ? '<p class="text-sm mt-1 capitalize">' + userstatus + '</p>' : ''}
                
            </div>`;
}

function _userMessageComponent(data, usersdetails) {
    const { from, message, createdat, id, mtype } = data
    const fromDetails = usersdetails.filter((item) => { return item.id === from })[0];
    console.log("fromDetails", fromDetails);
    return `<div class="flex items-start gap-x-3">
                <div class="min-w-8 min-h-8 bg-[${uuidToHexColor(fromDetails.id)}] uppercase rounded-full 
                    relative flex justify-center items-center text-white">
                    ${fromDetails.username[0]}
                    <div class="rounded-full bg-green-500 absolute bottom-0 right-0 cursor-pointer">
                    </div>
                </div>
                <div>
                    <p class="text-lg flex gap-x-3 items-center">
                        ${fromDetails.username} 
                        <span class="text-xs font-light text-bg-300 mt-1">
                            ${new Date(createdat).toLocaleTimeString()}
                        </span>
                    </p>
                    <p class="max-w-[30rem] mt-1 text-base font-light">
                        ${message}
                    </p>
                </div>
            </div>`
}

function _loggedUserCardComponent(data) {
    const { id, username } = data;
    return `<div class="min-w-12 min-h-12 bg-[${uuidToHexColor(id)}] rounded-full relative flex 
    justify-center items-center text-2xl text-white uppercase">
        ${username[0]}
        <div class="w-4 h-4 rounded-full bg-green-400 absolute bottom-0 right-0 cursor-pointer">
        </div>
    </div>
    <div class="w-full">
        <p class="flex justify-between font-medium items-center text-xl">
            #${username}
        </p>
        <p class="text-sm">
            Online
        </p>
    </div>`
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

function uuidToHexColor(uuid = "dd1a715f-106a-476e-9e32-10a7306a0fc0") {
    // Remove hyphens from UUID and convert it to lowercase
    const cleanUUID = uuid.replace(/-/g, '').toLowerCase();

    // Take the first 6 characters of the UUID and convert it to a hexadecimal color
    const hexColor = '#' + cleanUUID.substring(0, 6);

    return hexColor;
}