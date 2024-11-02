const dialog = document.querySelector(`#terms-and-condition-dialog`);

const accept = document.querySelector(`#accept-button`);
const decline = document.querySelector(`#decline-button`);

window.onload = function(){

    dialog.style.display = "block";

};

accept.onclick = function(){

    dialog.style.display = 'none';

};

decline.onclick = function(){

    history.back();
    
};

