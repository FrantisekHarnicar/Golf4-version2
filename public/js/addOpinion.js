/*
 * Created by Stefan Korecko, 2020-21
 * Opinions form processing functionality
 */

/*
This function works with the form:

<form id="opnFrm">
    <label for="nameElm">Your name:</label>
    <input type="text" name="login" id="nameElm" size="20" maxlength="50" placeholder="Enter your name here" required />
    <br><br>
    <label for="opnElm">Your opinion:</label>
    <textarea name="comment" id="opnElm" cols="50" rows="3" placeholder="Express your opinion here" required></textarea>
    <br><br>
    <input type="checkbox" id="willReturnElm" />
    <label for="willReturnElm">I will definitely return to this page.</label>
    <br><br>
    <button type="submit">Send</button>
</form>

 */
export default function processOpnFrmData(event){
    event.preventDefault();

        //2. Read and adjust data from the form (here we remove white spaces before and after the strings)
        const nopName = document.getElementById("name").value.trim();
        const nopComment = document.getElementById("comment").value.trim();
        const nopEmail = document.getElementById("email").value.trim();
        const nopUrl = document.getElementById("url").value.trim();
        const nopPohlavie = document.getElementById("formular").elements["pohlavie"].value;
        const nopOsobneUdaje = document.getElementById("osobne_udaje").checked;
        const nopEmail_novinky = document.getElementById("email_novinky").checked;

        //3. Verify the data
        if(nopName=="" || nopComment=="" || nopEmail == ""){
            window.alert("Please, enter all - name, comment and email");
            return;
        }
        var nopSex = "Neuvedene";
        if(nopPohlavie == '0'){
            nopSex = "Muz";
        }
        if(nopPohlavie == '1'){
            nopSex = "Zena";
        }

        //3. Add the data to the array opinions and local storage
        const newOpinion =
        {
            name: nopName,
            email: nopEmail,
            url: nopUrl,
            comment: nopComment,
            sex: nopSex,
            osobne_udaje: nopOsobneUdaje,
            email_novinky: nopEmail_novinky,
            created: new Date()
    };


    let opinions = [];

    if(localStorage.myTreesComments){
        opinions=JSON.parse(localStorage.myTreesComments);
    }

    opinions.push(newOpinion);
    localStorage.myTreesComments = JSON.stringify(opinions);


    //5. Go to the opinions
    window.location.hash="#opinions";

}
