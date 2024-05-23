(function() {

function tweetHistoryManager(){
    window.addEventListener('load', ()=>{
        // Set Eventhandeler for location change
        setTimeout(historyManage, 1000);

        // Populate The Sidebar
        setTimeout(populateSidebar, 1500);

        // Run Initial Save Tweet
        setTimeout(()=>{saveTweet(window.location.href)}, 2500);

    });

}

function historyManage() {

       const originalPushState = history.pushState;
       const originalReplaceState = history.replaceState;
   
       history.pushState = function() {
           originalPushState.apply(history, arguments);
           window.dispatchEvent(new Event('pushstate'));
           window.dispatchEvent(new Event('locationchange'));
       };
   
       history.replaceState = function() {
           originalReplaceState.apply(history, arguments);
           window.dispatchEvent(new Event('replacestate'));
           window.dispatchEvent(new Event('locationchange'));
       };
   
       window.addEventListener('popstate', () => {
           window.dispatchEvent(new Event('locationchange'));
       });
   
       window.addEventListener('locationchange', () => {
           console.log('Detect location change', window.location.href);
           setTimeout(() => { saveTweet(window.location.href); }, 2000);
       });

       chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'locationchange') {
            console.log('Location change detected');
            
            saveTweet(window.location.href); 
            sendResponse({ status: 'success' });
        }
    });
   
}

async function populateSidebar() {
    
    const tcp = document.querySelector("#tweet-container");
    const tbp = document.querySelector(".toggle-btn");
    if (tcp) tcp.remove();
    if (tbp) tbp.remove();

    const handleToggleBtn = (e) =>{
        e.preventDefault();
        const tc = document.querySelector("#tweet-container");
        tc.classList.toggle('active');
        e.target.classList.toggle('active');
    }
    const toggleBtn = document.createElement('div');
    toggleBtn.classList.add('toggle-btn');
    toggleBtn.innerText="Tweets History"
    toggleBtn.addEventListener('click', handleToggleBtn);
    const tweetContainer = document.createElement('div');
    tweetContainer.id = 'tweet-container';
    const tweetTitle = document.createElement('h3');
    tweetTitle.textContent="Simple Tweet History";
    tweetTitle.classList.add('tweet-history-title');
    tweetContainer.appendChild(tweetTitle);
    const tweetNavbar = document.createElement('form');
    tweetNavbar.innerHTML=`<input type="text" name="searchInput" id="searchInputTweet" />`
    tweetNavbar.classList.add("tweet-navbar");

    const searchInputBtn = document.createElement('button');
    searchInputBtn.classList.add('search-input-btn');
    searchInputBtn.textContent="Search";
    searchInputBtn.addEventListener('click', async (e)=>{
        e.preventDefault();
        const keyword = document.querySelector('#searchInputTweet');
        if(keyword.value){
            const results = await searchKeyword(keyword.value);
            const container = document.querySelector('#tweetsSearchContainer');

            container.innerHTML="";
            updateSidebar(results, container);
        }
        keyword.value = "";

        if(dropdownSearch.classList.contains('active')){
            dropdownSearch.classList.toggle('active');
            dropdownSearch.classList.toggle('active');
        }
        else{
            dropdownSearch.classList.toggle('active');
        }
        if (dropdown.classList.contains('active')){
            dropdown.classList.toggle('active');
        }
    });

    tweetNavbar.appendChild(searchInputBtn);

    tweetContainer.appendChild(tweetNavbar);


    const dropdownSearch = document.createElement('div');
    dropdownSearch.classList.add('dropdown');
    dropdownSearch.innerText="Search Results ";
    const arrowSearch = document.createElement('span');
    arrowSearch.classList.add('dropdown-arrow');
    arrowSearch.innerHTML="&#x25BC;";
    dropdownSearch.appendChild(arrowSearch);

    arrowSearch.addEventListener('click', (e)=>{
        e.preventDefault();
        dropdownSearch.classList.toggle('active');
    });

    const tweetElement2 = document.createElement('ul');
    tweetElement2.id = "tweetsSearchContainer";
    tweetElement2.classList.add('tweets');
    dropdownSearch.appendChild(tweetElement2);


    const dropdown = document.createElement('div');
    dropdown.classList.add('dropdown');
    dropdown.classList.add('active');
    dropdown.innerText="Show History ";
    const arrow = document.createElement('span');
    arrow.classList.add('dropdown-arrow');
    
    arrow.innerHTML="&#x25BC;";
    dropdown.appendChild(arrow);

    arrow.addEventListener('click', (e)=>{
        e.preventDefault();
        dropdown.classList.toggle('active');
    });

    const tweetElement = document.createElement('ul');
    tweetElement.id = "tweets-container";
    tweetElement.classList.add('tweets');

    dropdown.appendChild(tweetElement);

    tweetContainer.appendChild(dropdownSearch);
    tweetContainer.appendChild(dropdown);


    const db = await openDatabase();


    const result  = await fetchTweets(db, 10, 'desc'); 
    const tweets = result.data;
    setValue('lastKey', result.lastKey);
    setValue('jumpIdx', 20);
    
    appendSidebar(tweets, tweetElement);

    
    const loadBtn = document.createElement('button');
    loadBtn.id = "loadBtn";
    loadBtn.textContent="Load More";
    

    loadBtn.addEventListener('click', async ()=>{
        let jumpIdx = await getValue('jumpIdx');
        let lastKey =await  getValue('lastKey');
        const result = await fetchTweets(db, jumpIdx, 'desc', lastKey=lastKey);
        const tweets = result.data;
        setValue('lastKey', result.lastKey);
        const tc = document.querySelector("#tweets-container");
        updateSidebar(tweets, tc);
        if (!dropdown.classList.contains('active')){
            dropdown.classList.toggle('active');
        }
        if (dropdownSearch.classList.contains('active')){
            dropdownSearch.classList.toggle('active');
        }
    });

    tweetContainer.appendChild(loadBtn);

    document.body.appendChild(tweetContainer);
    document.body.appendChild(toggleBtn);
    


}

function updateSidebar(tweets, container=null){
    if (container){
        appendSidebar(tweets, container);    
    } else {
        appendSidebar(tweets);
    }
}

function appendSidebar(tweets, container){
        tweets.forEach((tweet, idx) => {
        const tweetInner = document.createElement('div');
        tweetInner.classList.add('tweet');

        if (tweet?.tname) {
        const userInfo = document.createElement('p');
        userInfo.innerHTML = `<strong>${tweet?.tname ?? ''} <span style="color:skyblue">${tweet.isVerified ? 'V' : ''}</span> @${tweet?.id ?? ''}</strong>`;
        const timestamp = document.createElement('p');
        timestamp.innerHTML = `${getTimeStamp(tweet.cctime)}`
        tweetInner.appendChild(userInfo);
        tweetInner.appendChild(timestamp);
            

        const deleteBtn = document.createElement('span');
        deleteBtn.innerHTML="Delete";
        deleteBtn.className="delete-btn delete";
        deleteBtn.addEventListener('click', async (e)=>{
            e.preventDefault();
            await handleDeleteTweet(tweet.href);
        });

        tweetInner.appendChild(deleteBtn);


        const tweetContent = document.createElement('p');
        tweetContent.textContent = tweet?.content ?? '';
        tweetInner.appendChild(tweetContent);
        

        if (tweet?.replies || tweet?.reposts || tweet?.likes || 
            tweet?.bookmarks || tweet?.views){
        const tweetnav = document.createElement('ul');
        
        const replies = document.createElement('li');
        replies.textContent = `replies ${tweet?.replies}`;
        tweetnav.appendChild(replies)
        const reposts = document.createElement('li');
        reposts.textContent = `reposts ${tweet?.reposts}`;
        tweetnav.appendChild(reposts)
        const likes = document.createElement('li');
        likes.textContent = `likes ${tweet?.likes}`;
        tweetnav.appendChild(likes)
        const bookmarks = document.createElement('li');
        bookmarks.textContent = `bookmarks ${tweet?.bookmarks}`;
        tweetnav.appendChild(bookmarks)
        const views = document.createElement('li');
        views.textContent = `views ${tweet?.views}`;
        tweetnav.appendChild(views)

        tweetInner.appendChild(tweetnav);
    }
    

        const tweetLink = document.createElement('a');
        tweetLink.href = tweet?.href;
        tweetLink.textContent = 'Tweet Link';
        tweetInner.appendChild(tweetLink);
        
        
        } else{

            const tweetInfo = document.createElement('p');
            tweetInfo.innerHTML = `${tweet?.info}`;
            const timestamp = document.createElement('p');
            timestamp.innerHTML = `${getTimeStamp(tweet.cctime)}`
            tweetInner.appendChild(tweetInfo);
            tweetInner.appendChild(timestamp);

            const deleteBtn = document.createElement('span');
            deleteBtn.innerHTML="Delete";
            deleteBtn.className="delete-btn delete";
            deleteBtn.addEventListener('click', async (e)=>{
                e.preventDefault();
                await handleDeleteTweet(tweet.href);
                populateSidebar();
            });
            tweetInner.appendChild(deleteBtn);

            const tweetLink = document.createElement('a');
            tweetLink.href = tweet?.href;
            tweetLink.textContent = 'Tweet Link';
            tweetInner.appendChild(tweetLink);
        }

    if (tweets.length === 1){
        container.insertAdjacentHTML('afterbegin', '<div class="tweet">'+tweetInner.innerHTML+'</div>');
    }
    else{
        container.appendChild(tweetInner);
    }
        
    });
}


function crawlTweet(href){
    const cctime = Date.now();
    const target = getMatchingElement(href);
    let resultTweet = []
    if (target)
    {
        let info = String(target.node.computedName);
        let data;
        info.trim();
        data = parseTextModified(info);
        if(data?.tname){ }
        else {
            data = parseText2(info);
        }
        data = substituteText(data, "Popular in your area")
        data = substituteText(data, "Provides details about protected accounts.")
        info+=' ';
        info+= getTimeStamp(cctime);
        const href = target.href
        resultTweet = [{href, info, ...data, cctime}];
    }
    return resultTweet;
}



function substituteText(data, phrase){
    if (data?.tname.includes(phrase)) {
        data["tname"] = data?.tname.replace(phrase, '').trim();
      }
      return data
}

function getTimeStamp(date){

    const ctime = new Date(date);
    const options = {
        // weekday: "short"
        year: "numeric", //2022
        month: "2-digit", //03
        day: "numeric" //02
    };
    const result = ctime.toLocaleDateString("default", options).concat(" ").concat(
    ctime.toLocaleTimeString("default", {hour:"numeric", minute:"numeric", dayPeriod:"short"}));

    return result;
}

function getMatchingElement(href) {
    
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
        const parser = document.createElement('a');

    parser.href = href;
    const path = parser.pathname;

    for (let i = 0; i < tweets.length; i++) {
      const node = tweets[i];
      const anchorTags = node.querySelectorAll('a');
  
      for (let anchor of anchorTags) {
        if (anchor.href.endsWith(path)) {
          return {
            index: i,
            node: node,
            href: parser.href
          };
        }
      }
    }
  

    return null;
  }

  
    function parseTextModified(text) {
        const regex = /^(.+?)(?:\s+Verified account)?\s+@([^\s]+)\s+(.+?)(?:\s+(\d+)\s+repl(?:y|ies),)?(?:\s+(\d+)\s+repost(?:s)?,)?(?:\s+(\d+)\s+like(?:s)?,)?(?:\s+(\d+)\s+bookmark(?:s)?,)?(?:\s+(\d+)\s+view(?:s)?)?$/;
        const match = text.match(regex);
        if (match) {
            return {
                tname: match[1].trim(),
                id: match[2].trim(),
                content: match[3].trim(),
                replies: match[4] ? parseInt(match[4], 10) : 0,
                reposts: match[5] ? parseInt(match[5], 10) : 0,
                likes: match[6] ? parseInt(match[6], 10) : 0,
                bookmarks: match[7] ? parseInt(match[7], 10) : 0,
                views: match[8] ? parseInt(match[8], 10) : 0,
                isVerified: text.includes('Verified account')
            };
        } else {
            return null;
        }
    }
    
    function parseText2(info){
        let data = {};
        const pattern = /(?<tname>.+?)(?:\s+Verified account)?\s+@(?<id>[^\s]+)\s+(?<content>.*)/g;
                const matches = [...info.matchAll(pattern)];    
                if (matches.length > 0) {
                    matches.forEach(match => {
                        const { groups: { tname, id, content } } = match;
                        const isVerified = match[2] !== undefined;
                        data = {tname, id, content, isVerified}
                    });
                } else {
                    console.log('No sub matches found.');
                }
    
        return data;
    }

function getValue(key) {
    return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
        resolve(result[key] !== undefined ? result[key] : null);
        });
    });
    }

    function setValue(key, value) {
    return new Promise((resolve) => {
        let items = {};
        items[key] = value;
        chrome.storage.local.set(items, () => {
        resolve();
        });
    });
    }

let dbInstance = null;

async function openDatabase() {
    if (dbInstance){
        return dbInstance
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open("tweetsmDB", 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            const objectStore = db.createObjectStore("tweets", {
                keyPath: "href"
            });
         
            objectStore.createIndex("info", "info", { unique: false, direction: 'prev' });
            objectStore.createIndex("cctime_asc", "cctime", { unique: false });
            objectStore.createIndex('cctime_desc', 'cctime', { unique: false, direction: 'prev' });
        };
        request.onsuccess = (event) => {
            dbInstance = resolve(event.target.result);
            resolve(dbInstance);
        };
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}


async function insertTweet(db, tweet){
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["tweets"], "readwrite");
        const store = transaction.objectStore("tweets");
        const request = store.add(tweet);
        request.onsuccess = () => resolve();
        request.onerror = (event) => {
            if (event.target.error.name === "ConstraintError"){
                console.log("Skip insertion, Tweet already exists");
            }
            reject(event.target.error);
        };
    });

}

async function handleDeleteTweet(hash){
    if (confirm("Do you want to delete this tweet?")){
        await deleteTweet(hash);
    }
    else{
        "Canceled"
    }
}

async function deleteTweet(hash){
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["tweets"], "readwrite");
        const store = transaction.objectStore("tweets");
        const request = store.delete(hash);
        request.onsuccess = () => {
            console.log("Removed Tweet!");
            resolve()};
        request.onerror = (event) => reject(event.target.error);
    });

}

function getTweet(db, hash){
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["tweets"]);
        const store = transaction.objectStore("tweets");
        const request = store.get(hash);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function getTweets(db){
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["tweets"]);
        const store = transaction.objectStore("tweets");
        const index = store.index("cctime_desc");
        const request = index.getAll();
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        request.onerror = (event) => reject(event.target.error);
    });
}


function fetchTweets(db, count, direction, lastKey = null) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("tweets", 'readonly');
      const objectStore = transaction.objectStore("tweets");
      const index = objectStore.index("cctime_desc");
      const results = [];
  
      let cursorRequest;
    if (direction === 'asc') {
      cursorRequest = lastKey ? index.openCursor(IDBKeyRange.lowerBound(lastKey, true), 'next') : index.openCursor(null, 'next');
    } else if (direction === 'desc') {
      cursorRequest = lastKey ? index.openCursor(IDBKeyRange.upperBound(lastKey, true), 'prev') : index.openCursor(null, 'prev');
    } else {
      reject(new Error('Invalid direction'));
      return;
    }

    cursorRequest.onsuccess = function(event) {
      const cursor = event.target.result;
      if (cursor && results.length < count) {
        results.push(cursor.value);
        lastKey = cursor.key; 
        cursor.continue();
      } else {
        resolve({
          data: results,
          lastKey: lastKey
        });
      }
    };

    cursorRequest.onerror = function(event) {
      reject(event.target.error);
    };
  });
}

async function saveTweet(href){ 
    const newTweets = crawlTweet(href);
    const db = await openDatabase();
    Array.from(newTweets).forEach( (newTweet)=>{

        if (newTweet.href !== "https://x.com/home"){
        try{
                insertTweet(db, newTweet).then(()=>{
                const tc = document.querySelector("#tweets-container");
                updateSidebar([newTweet], tc);
                console.log("Updated history");
             });
            } catch(error){
             console.log("Failed inserting db error: ", error);
            }
        }
    })
}

function deleteDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(tweetsmDB);
  
      request.onerror = function(event) {
        reject(event.target.error);
      };
  
      request.onsuccess = function(event) {
        resolve();
      };
    });
  }



  
  async function searchTweets(keyword) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {

        const transaction = db.transaction(['tweets'], 'readonly');
        const objectStore = transaction.objectStore('tweets');
        const index = objectStore.index('info');
  
        const results = [];
        const cursorRequest = index.openCursor(IDBKeyRange.bound(keyword, keyword + '\uffff'));
  
        cursorRequest.onsuccess = function(event) {
          const cursor = event.target.result;
          if (cursor) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        cursorRequest.onerror = function(event) {
          reject(event.target.error);
        };
    });
  }


  async function searchKeyword(keyword) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("tweets", 'readonly');
      const objectStore = transaction.objectStore("tweets");
      const index = objectStore.index('info');
      const results = [];
      const query = keyword.toLowerCase();
  
      index.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
          const value = cursor.value;
          const info = value.info.toLowerCase();
  
          if (info.includes(query)) {
            results.push(value);
          }
  
          cursor.continue();
        } else {
          resolve(results);
        }
      };
  
      index.openCursor().onerror = function(event) {
        reject(event.target.error);
      };
    });
  }

tweetHistoryManager();

})();


