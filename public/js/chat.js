const socket=io()

//Elements
const $messageForm=document.querySelector("#message-form");
const $messageFormInput=$messageForm.querySelector("input");
const $messageFormButton=$messageForm.querySelector("button");
const $sendLocationButton=document.querySelector("#send-location");
const $messages=document.querySelector("#messages");

//Templates
const messagetemplate=document.querySelector("#message-template").innerHTML;
const locationmessagetemplate=document.querySelector("#location-message-template").innerHTML;
const sidebarTemplate=document.querySelector("#sidebar-template").innerHTML;

//Options
const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoScroll=()=>{
    //new msg element
    const $newMessage=$messages.lastElementChild;

    //height of last message
    const newmsgStyle=getComputedStyle($newMessage);
    const newmsgMargin=parseInt(newmsgStyle.marginBottom);
    const newMsgHeight=$newMessage.offsetHeight + newmsgMargin;
    //visible height
    const visibleHeight=$messages.offsetHeight
    //height of messaging container
    const containerHeight=$messages.scrollHeight
    //how far have i scroll
    const scrollOffset=$messages.scrollTop+visibleHeight;

    if(containerHeight-newMsgHeight <= scrollOffset){
        $messages.scrollTop=$messages.scrollHeight
    }

}


socket.on("message",(message)=>{
    console.log(message);
    const html=Mustache.render(messagetemplate,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoScroll();
})

socket.on("locationmessage",(message)=>{
    console.log(message);
    const html=Mustache.render(locationmessagetemplate,{
        username:message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoScroll();

})
socket.on('roomdata',({room,users})=>{
    const html=Mustache.render(sidebarTemplate,{
        room,
        users,
    });
    document.querySelector("#sidebar").innerHTML=html;
    

})

$messageForm.addEventListener("submit",(e)=>{
    e.preventDefault();
    //disable
    $messageFormButton.setAttribute('disabled','disabled');


    const message=e.target.elements.message.value;
    socket.emit("sendMessage",message,(error)=>{
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value='';
        $messageFormInput.focus();
        //enable
     if(error){
         return console.log(error);
     }
     console.log("Message delivered");
    });
})

$sendLocationButton.addEventListener("click",()=>{
    if(!navigator.geolocation){
        return alert("Geolocation not supported");
    }
    $sendLocationButton.setAttribute('disabled','disabled');
    navigator.geolocation.getCurrentPosition((position)=>{
        console.log(position);
        socket.emit("sendLocation",{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude,
        },()=>{
            $sendLocationButton.removeAttribute('disabled');
            console.log("Location shared ")
        })
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href="/"
    }
})