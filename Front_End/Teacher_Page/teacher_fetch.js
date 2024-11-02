async function loadTeacherData(){

    const token = localStorage.getItem('token');

    if(!token){

        alert(`No token found. Please Log In!`);
        return;

    }

    try{

        const response = await fetch(`http://localhost:5000/student_user/view`, {

            method: 'GET',
            headers: {

                'Authorization' :  token

            }

        });

        const data = await response.json();

        if(!data){

            throw new Error(`No data found`);

        }

        const fullName = `${data.First_Name} ${data.Last_Name}`
        document.querySelector(`#teacher-name`).textContent = fullName;

    }catch(error){

        console.log(error);

    }

}

async function loadGradeSection(){

    const token = localStorage.getItem("token");

    if(!token){

        alert(`No token found. Please Log In!`);
        return;

    }

    try{

        const response = await fetch(`http://localhost:5000/grade_and_section/list`, {

            method: 'GET',
            headers: {

                'Authorization' :  token

            }

        });

        const grade_and_section = await response.json();

        if(!grade_and_section){

            throw new Error(`No data found`);

        }

        const container = document.querySelector(`#grade-section-container`);
        container.innerHTML = '';

        grade_and_section.forEach(item => {
            
            const card = document.createElement('div');
            card.className = 'class-card';

            card.innerHTML = `
                <div>
                    <h5> ${item.Grade_level} - ${item.Class_Section} </h5>
                    
                </div>
                <a href="../Sections_Page/${item.Grade_level}_${item.Class_Section}.html" class="view-class-button"> View Class </a>

                `;

            container.appendChild(card);

        });

    }catch(error){

        console.log(error);

    }

}

loadTeacherData();
loadGradeSection();