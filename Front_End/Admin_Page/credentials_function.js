// SHOW DIALOG
const add_dialog = document.querySelector(`#Add-User-Dialog`);
const showAddUserForm = (show) => show ? add_dialog.showModal() : add_dialog.close();


// EDIT DIALOG
const edit_dialog = document.querySelector(`#Edit-User-Dialog`);
const cancel_button = document.querySelector(`#cancel-button`);

const showEditDialog = (show) => show ? edit_dialog.showModal() : edit_dialog.close();
cancel_button.addEventListener('click', () => edit_dialog.close());


// ADD CREDENTIALS TOGGLE PASSWORD
const passwordInput = document.querySelector(`#password`);
const togglePassword = document.querySelector(`#togglePassword`);

togglePassword.addEventListener('click', function () {

    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    this.classList.toggle('fa-eye-slash');

});

// EDIT TOGGLE PASSWORD
const edit_password = document.querySelector(`#edit-password`);
const toggleEditPassword = document.querySelector(`#toggleEditPassword`);

toggleEditPassword.addEventListener('click', function () {

    const type = edit_password.getAttribute('type') === 'password' ? 'text' : 'password';
    edit_password.setAttribute('type', type);

    this.classList.toggle('fa-eye-slash');

});


// FILTER SELECT OPTION
document.querySelector(`#grade`).addEventListener('change', function (){

    const grade = this.value;
    const sectionContainer = document.querySelector(`#sectionContainer`);
    
    sectionContainer.innerHTML = '';

    if(grade === '7'){
        
        const sectionSelect = document.createElement('select');
        sectionSelect.id = 'section';

        ['Lirio', 'Freesia', 'Hyacinth'].forEach(section => {

            const option = document.createElement('option');
            option.value = section.toLowerCase();
            option.textContent = section;
            sectionSelect.appendChild(option);

        });

        sectionContainer.appendChild(sectionSelect);

    }else if(grade === '8'){

        const sectionSelect = document.createElement('select');
        sectionSelect.id = 'section';

        ['Acacia', 'Narra', 'Primrose'].forEach(section => {

            const option = document.createElement('option');
            option.value = section.toLowerCase();
            option.textContent = section;
            sectionSelect.appendChild(option);

        });

        sectionContainer.appendChild(sectionSelect);

    }else if(grade === '9'){

        const sectionSelect = document.createElement('select');
        sectionSelect.id = 'section';

        ['Amber', 'Gold', 'Silver'].forEach(section => {

            const option = document.createElement('option');
            option.value = section.toLowerCase();
            option.textContent = section;
            sectionSelect.appendChild(option);

        });

        sectionContainer.appendChild(sectionSelect);

    }else if(grade === '10'){

        const sectionSelect = document.createElement('select');
        sectionSelect.id = 'section';

        ['Rizal', 'Bonifacio', 'Chris Santos'].forEach(section => {

            const option = document.createElement('option');
            option.value = section.toLowerCase();
            option.textContent = section;
            sectionSelect.appendChild(option);

        });

        sectionContainer.appendChild(sectionSelect);

    }else{
        
        const sectionInput = document.createElement('input');
        sectionInput.type = 'text';
        sectionInput.id = 'section';
        sectionInput.placeholder = 'Enter Section';

        sectionContainer.appendChild(sectionInput);
    }
    
});