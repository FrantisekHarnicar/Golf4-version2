/*
 * routes definition and handling for paramHashRouter
 */

import Mustache from "./mustache.js";
import processOpnFrmData from "./addOpinion.js";

//an array, defining the routes
export default[

    {
        //the part after '#' in the url (so-called fragment):
        hash:"welcome",
        ///id of the target html element:
        target:"router-view",
        //the function that returns content to be rendered to the target html element:
        getTemplate:(targetElm) =>
            document.getElementById(targetElm).innerHTML = document.getElementById("template-welcome").innerHTML
    },
    
    {
        hash:"articles",
        target:"router-view",
        getTemplate: fetchAndDisplayArticles
    },

    {
        hash:"opinions",
        target:"router-view",
        getTemplate: createHtml4opinions
    },
    
    {
    hash:"addOpinion",
    target:"router-view",
    getTemplate: (targetElm) =>{
        document.getElementById(targetElm).innerHTML = document.getElementById("template-addOpinion").innerHTML;
        document.getElementById("formular").onsubmit=processOpnFrmData;
    }
}
    

];

function createHtml4opinions(targetElm){
    const opinionsFromStorage=localStorage.myTreesComments;
    let opinions=[];

    if(opinionsFromStorage){
        opinions=JSON.parse(opinionsFromStorage);
        opinions.forEach(opinion => {
            opinion.created = (new Date(opinion.created)).toDateString();
            opinion.willReturn = 
              opinion.willReturn?"I will return to this page.":"Sorry, one visit was enough.";
        });
    }

    document.getElementById(targetElm).innerHTML = Mustache.render(
        document.getElementById("template-opinions").innerHTML,
        opinions
        );
}       


function fetchAndDisplayArticles(targetElm,current){
    const url = "https://wt.kpi.fei.tuke.sk/api/article";
    const Pages = 20;
    if(localStorage.offset && current === undefined)
        current = JSON.parse(localStorage.offset);
    else 
        if(current === undefined)
            current = 1;
    let urlQuery = `?offset=${(current-1)*Pages}&max=${Pages}`;

    const offsetUrl = `${url}${urlQuery}`;

    let articleList =[];

    fetch(offsetUrl)  //there may be a second parameter, an object wih options, but we do not need it now.
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{
                return Promise.reject(new Error(`Failed to access the list of articles. Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then(responseJSON => {
            addPage(responseJSON,Pages);
            articleList=responseJSON;
            return Promise.resolve();
        })
        .then( ()=> {
            let cntRequests = articleList.articles.map(
                article => fetch(`${url}/${article.id}`)
            );
            return Promise.all(cntRequests);
        })
        .then(responses =>{
            let failed="";
            for(let response of responses) {
                if(!response.ok) failed+=response.url+" ";
            }
            if(failed===""){
                return responses;
            }else{
                return Promise.reject(new Error(`Failed to access the content of the articles with urls ${failed}.`));
            }
        })
        .then(responses => Promise.all(responses.map(resp => resp.json())))
        .then(articles => {
            articles.forEach((article,index) =>{
                articleList.articles[index].content=article.content;
            });
            return Promise.resolve();
        })
        .then( () =>{
            return document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles").innerHTML,
                    articleList
                );
        })
        .catch(error => {
            const errMsgObj = {errMessage: error};
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        });

        window.onbeforeunload = () => {
            localStorage.removeItem('offset');
        }
}


function addPage(responseJSON, pages) {
    const offset = Number(responseJSON.meta.offset);
    const total = Number(responseJSON.meta.totalCount);

    let current = Math.ceil(offset/pages) + 1;
    let tot = Math.ceil(total/pages);

    if (current > 1) {
        responseJSON.prevPage = current - 1;
    }

    if ((offset + pages) < total) {
        responseJSON.nextPage = current + 1;
    }

    responseJSON.currPage = current;
    responseJSON.pageCount = tot;
    window.localStorage.setItem('offset', current);
}
