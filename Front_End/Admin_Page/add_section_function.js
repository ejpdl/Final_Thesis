const add_dialog = document.querySelector(`#Add-User-Dialog`);
const showAddUserForm = (show) => show ? add_dialog.showModal() : add_dialog.close();


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