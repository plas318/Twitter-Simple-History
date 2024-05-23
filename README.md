## Twitter Simple History 
Simple extension that tracks and saves the history of tweets you've clicked on for revisiting

### E.g
![th5](https://github.com/plas318/Twitter-Simple-History/assets/64758800/fb5cf37d-2ed8-430e-8fec-21a2cd7d8b49)


![th2](https://github.com/plas318/Twitter-Simple-History/assets/64758800/a8849514-54e8-46d6-9588-619b34f23bf3)


This extension/script was quickly made to simply track your tweets and save them using the web browser's indexedDB

The extension would detect your changes of browser url and save the tweet data on indexedDB, user can save/delete, and query on the saved tweets.

Each tweet gets the user name, id, verfied_info, content of the tweet and a link to revisit the tweet. Some tweets might not be parsed properly due to utf-8 issues.

Since it was made quick and I'm not the best dev out there, there's many bugs. 
It generally seems to work for me, if not on page refresh

I haven't tested the extension with more than a thousand tweets, so there could be consequences to the performance once the db gets too large.

*Especially there is no limit to the return results of the search, so if you search for keywords
such as: likes, views, replies, a, i, o, u ... would return you all the tweets which could potentially cause performance issues//

You might have to delete the db once in a while if it gets too big.
F12 ->Application->IndexedDB delete (twittermDB)

### Stacks
- pure Javascript, CSS

### Functions
- [ ] Save Tweet
- [ ] Delete Tweet
- [ ] Search Tweets

*Search can be done with any text show on the tweet including name, id, content, date, views, likes ..


`Simply Install and open twitter / X to start tracking visits`


mypage: https://ko-fi.com/cre3ent
