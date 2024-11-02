async function fetchSections(){

    const token = localStorage.getItem("token");

    try{

        const response = await fetch(`http://localhost:5000/grade_and_section/list`, {

            method: 'GET',
            headers: {

                'Content-Type'  :  'application/json',
                'Authorization' :   token

            }


        });

        const users = await response.json();
        const tableBody = document.querySelector(`#userTable tbody`);
        tableBody.innerHTML = '';

        document.getElementById('studentCount').textContent = `${users.length}`;

        users.forEach(user => {

            const row = document.createElement('tr');
            row.innerHTML = `

                <td> ${user.id} </td>
                <td> ${user.Grade_level} </td>
                <td> ${user.Class_Section} </td>
                <td> 
                    <button class = "btn secondary" onclick = "deleteGradeSection('${user.id}')"> Delete </button>
                </td>

            `;

            tableBody.appendChild(row);

        });


    }catch(error){

        console.log(error);

    }

}

fetchSections();


async function addGradeSection(){

    const token = localStorage.getItem("token");

    const newGradeSection = {

        id: document.querySelector(`#id`).value,
        grade_level: document.querySelector(`#grade`).value,
        section: document.querySelector(`#section`).value

    };

    try{

        const response = await fetch(`http://localhost:5000/grade_and_section/add`, {

            method: 'POST',
            headers: {

                'Content-Type'  :  'application/json',
                'Authorization' :   token

            },

            body: JSON.stringify(newGradeSection)

        });

        if(response.ok){

            alert(`${newGradeSection.grade_level} - ${newGradeSection.section} Successfully Added`);
            location.reload();
            fetchSections();

        }else{

            const errorData = await response.json();
            alert(`Error Data: ${errorData}`);

        }


    }catch(error){

        console.log(error);

    }

}

async function deleteGradeSection(id){

    const token = localStorage.getItem("token");

    try{

        if(!confirm(`Are you sure you want to delete ID ${id}?`)) return;

        const response = await fetch(`http://localhost:5000/grade_and_section/delete/${id}`, {

            method: 'DELETE',
            headers: {

                'Authorization' :   token

            }

        });

        if(response.ok){

            alert(`User deleted successfully`);
            fetchSections();

        }else{

            const errorData = await response.json();
            alert(`Error Data: ${errorData}`);

        }

    }catch(error){

        console.log(error);

    }

}