'use strict';
for(const [type,max]of [['card',7],['hammer',6],['mirror',6]])for(let level=1;level<=max;level++)window.MERGE_GAME_ASSETS[type+level]=`assets/tool/${type}${level}.png`;
