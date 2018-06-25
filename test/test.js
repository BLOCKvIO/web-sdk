let ai = localStorage.getItem('appID');
if(!ai){
  swal({
    title : "Setup - AppID",
    text : "We need a App ID from you to get started.",
    content : "input"
  }).then(name => {

    localStorage.setItem('appID', name);
    location.reload();
  })
}else{
  var tb = document.getElementById('topbar');
  tb.children[0].innerHTML = 'Logged in with account :'+ai;
}


var UM_scripts = {
  login : "bv.UserManager.login('+27649165910', 'phone_number', 'test').then(data=>{ log(data) });",

}

function load(name){

  var input = document.getElementById('input');
  input.innerHTML = UM_scripts[name];



}

function runCode() {
  var source = document.getElementById('input');

  function log(txt) {
    console.log("=-==-=-=-=-=-=");
    console.log(txt);
    console.log("=-==-=-=-=-=-=");
    if(typeof txt != "string")
      txt = JSON.stringify(txt)
    document.getElementById("output").innerHTML += txt + "\n"
  }
  eval(source.value)
}




let blov = new Blockv({
"appID" : "37914cb6-0267-44dc-a50b-5bc3a8a74e80",
"server" : "https://api.blockv.io",
"websocketAddress" : "wss://newws.blockv.io",
"prefix" : "sockets"
});

blov.UserManager.login("+27649165910", "phone_number", "test").then(data=>{

  console.log(data);
  blov.WebSockets.connect();

  blov.WebSockets.addEventListener('stateUpdate', function(data){
    console.log("States");
    console.log(data);
  })


  blov.WebSockets.addEventListener('inventory', function(data){
    console.log("Inventory");
    console.log(data);
  });


  blov.WebSockets.addEventListener('activity', function(data){
    console.log("Activity");
    console.log(data);
  })


  blov.WebSockets.addEventListener('all', function(data){
    console.log("All");
    console.log(data);
  })

  //bv.Chat.myThreads().then(console.log);
});


/*

let filter = new Blockv.Discover(bv);
filter.setScope("vAtom::vAtomType.owner", "$currentuser");
filter.appendFilter("vAtom::vAtomType.template", "vatomic::v1::vAtom::Avatar", "Match", "And");
filter.execute();
*/
