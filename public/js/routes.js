/*
 * routes definition and handling for paramHashRouter
 */

import Mustache from "./mustache.js";
import processOpnFrmData from "./addOpinion.js";
import articleFormsHandler from "./articleFormsHandler.js";

//an array, defining the routes
export default[

    {
        //the part after '#' in the url (so-called fragment):
        hash:"welcome",
        ///id of the target html element:
        target:"router-view",
        //the function that returns content to be rendered to the target html element:
        getTemplate:(targetElm) =>
            document.getElementById(targetElm).innerHTML = 
                document.getElementById("template-welcome").innerHTML
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
    },

    {
        hash:"article",
        target:"router-view",
        getTemplate: fetchAndDisplayArticleDetail
    },
    
    {
        hash:"artEdit",
        target:"router-view",
        getTemplate: editArticle
    },
    {
        hash:"artDelete",
        target:"router-view",
        getTemplate: deleteArticle
    },
    {
        hash:"addArticle",
        target:"router-view",
        getTemplate: insertArticle
    }
];

const maxArticles = 20;
const urlBase = "http://wt.kpi.fei.tuke.sk/api";


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




function addArtDetailLink2ResponseJson(responseJSON){
    responseJSON.articles = responseJSON.articles.map(
      article =>(
       {
         ...article,
         detailLink:`#article/${article.id}/${responseJSON.meta.offset}/${responseJSON.meta.totalCount}`
       }
      )
    );
}   



function fetchAndProcessArticle(targetElm,artIdFromHash,offsetFromHash,totalCountFromHash,forEdit){
    const url = `${urlBase}/article/${artIdFromHash}`;

    fetch(url)
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{ //if we get server error
                return Promise.reject(
                  new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then(responseJSON => {
            if(forEdit){
                responseJSON.formTitle="Article Edit";
                responseJSON.submitBtTitle="Save article";
                responseJSON.backLink=`#article/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;
            
                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article-form").innerHTML,
                        responseJSON
                    );
                if(!window.artFrmHandler){
                    window.artFrmHandler= new articleFormsHandler("https://wt.kpi.fei.tuke.sk/api");
                }
                window.artFrmHandler.assignFormAndArticle("articleForm","hiddenElm",artIdFromHash,offsetFromHash,totalCountFromHash);
            }else{
                responseJSON.backLink=`#articles/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.editLink=
                  `#artEdit/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.deleteLink=
                  `#artDelete/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;

                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article").innerHTML,
                        responseJSON
                    );
            }
        })
        .catch (error => { ////here we process all the failed promises
            const errMsgObj = {errMessage:error};
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        });
}    

function editArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments,true);
} 

function fetchAndDisplayArticleDetail(targetElm,artIdFromHash,offsetFromHash,totalCountFromHash) {
    fetchAndProcessArticle(...arguments,false);
}  

function deleteArticle(targetElm, artIdFromHash) {
   fetch(`${urlBase}/article/${artIdFromHash}`, {method: 'DELETE'})
   .then(()=>{
       fetchAndDisplayArticles(targetElm, window.sessionStorage.getItem('articlesPage'));
   });
  }


  function insertArticle (targetElm) {
    let msrender = [];
    document.getElementById(targetElm).innerHTML = Mustache.render(
        document.getElementById("template-article-add").innerHTML,
        msrender
    );
    document.getElementById("articleadd").addEventListener("submit", event => addArticle(event, targetElm));
}

function addArticle(event,targetElm,artIdFromHash,offsetFromHash,totalCountFromHash){
    event.preventDefault();
    
    
    const title= document.getElementById("title").value.trim();
    const content= document.getElementById("content").value.trim();
    const author= document.getElementById("author").value.trim();

    const imageLink= document.getElementById("imageLink").value.trim();
    const tags = "golf4";
   
    const articleData = {
        title: title,
        content: content,
        author: author,
        imageLink: imageLink,
        tags : tags
    };

    const url = `${urlBase}/article/`;

    const postReqSettings = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                },
                body: JSON.stringify(articleData)
            };

    fetch(url, postReqSettings)
    .then(response => {      //fetch promise fullfilled (operation completed successfully)
        if (response.ok) {    //successful execution includes an error response from the server. So we have to check the return status of the response here.
            return response.json(); //we return a new promise with the response data in JSON to be processed
        } else { //if we get server error
            return Promise.reject(
                new Error(`Server answered with ${response.status}: ${response.statusText}.`)); //we return a rejected promise to be catched later
        }
    })
    .then(responseJSON => {
        const id = Number(responseJSON.id);
        window.location.hash = `article/${id}`;
    })
    .catch (error => { ////here we process all the failed promises
        const errMsgObj = {errMessage:error};
        document.getElementById(targetElm).innerHTML =
            Mustache.render(
                document.getElementById("template-articles-error").innerHTML,
                errMsgObj
            );
    });
}
function fetchAndDisplayArticles(targetElm,current){

    let articleList = [];
    
    if(current === undefined && localStorage.current)
        current = JSON.parse(localStorage.current);
    else 
        if(current === undefined)
            current = 1;


    console.log("current " + current);

    const offset = ((current-1)*maxArticles);


    const fetchUrl = `${urlBase}/article/?tag=golf4&max=${maxArticles}&offset=${offset}`;


    fetch(fetchUrl)  //there may be a second parameter, an object wih options, but we do not need it now.
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{
                return Promise.reject(new Error(`Failed to access the list of articles. Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then(responseJSON => {
            showNewPage(responseJSON,maxArticles);
            articleList=responseJSON;
            addArtDetailLink2ResponseJson(responseJSON);
            return Promise.resolve();
        })
        .then( ()=> {
            let cntRequests = articleList.articles.map(
                article => fetch(`${urlBase}/article/${article.id}`)
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
            localStorage.removeItem('current');
        }
}

  

function showNewPage(responseJSON, maxArticlesToShow) {
    const offset = Number(responseJSON.meta.offset);
    const total = Number(responseJSON.meta.totalCount);

    let current = Math.ceil(offset/maxArticlesToShow) + 1;
    let tot = Math.ceil(total/maxArticlesToShow);

    if (current > 1) {
        responseJSON.prevPage = current - 1;
    }

    if ((offset + maxArticlesToShow) < total) {
        responseJSON.nextPage = current + 1;
    }

    responseJSON.currPage = current;
    responseJSON.pageCount = tot;

    window.localStorage.setItem('current', current); 
}
