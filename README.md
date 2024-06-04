```
    .....                                                                                  ..    .                  
 .H8888888h.  ~-.                                                                    x .d88"    @88>                
 888888888888x  `>                .u    .    .d``                        x.    .      5888R     %8P      u.    u.   
X~     `?888888hx~       u      .d88B :@8c   @8Ne.   .u         u      .@88k  z88u    '888R      .     x@88k u@88c. 
'      x8.^"*88*"     us888u.  ="8888f8888r  %8888:u@88N     us888u.  ~"8888 ^8888     888R    .@88u  ^"8888""8888" 
 `-:- X8888x       .@88 "8888"   4888>'88"    `888I  888. .@88 "8888"   8888  888R     888R   ''888E`   8888  888R  
      488888>      9888  9888    4888> '       888I  888I 9888  9888    8888  888R     888R     888E    8888  888R  
    .. `"88*       9888  9888    4888>         888I  888I 9888  9888    8888  888R     888R     888E    8888  888R  
  x88888nX"      . 9888  9888   .d888L .+    uW888L  888' 9888  9888    8888 ,888B .   888R     888E    8888  888R  
 !"*8888888n..  :  9888  9888   ^"8888*"    '*88888Nu88P  9888  9888   "8888Y 8888"   .888B .   888&   "*88*" 8888" 
'    "*88888888*   "888*""888"     "Y"      ~ '88888F`    "888*""888"   `Y"   'YP     ^*888%    R888"    ""   'Y"   
        ^"***"`     ^Y"   ^Y'                  888 ^       ^Y"   ^Y'                    "%       ""                 
                                               *8E                                                                  
                                               '8>                                                                  
                                                "                                                                   
```

# Architecture Diagrams (due 6/5/24)
## [Data Relation Diagram](api_data_relation.md)
## [Systems Architecture](api_arch_diagram.md)
## Justifications
The layout of this program was pretty straightforward. I think I can say that I took the approach of adapting my other 4 projects into this project. So the architecture of Tarpaulin will definitely be influenced by what I called Howl (like Yelp).

I think that my diagrams speak for themselves, and they may be saying that they are kind of ambitious. For the moment the structure mimics what I've build before, with a JWT backed authorization program. However, with Tarpaulin we have the additional requirement of IP-based rate limiting. I think that won't be too crazy, and it'll just be an additional middleware function.

The hardest thing I think will be `GET blah/roster` because I want to do defered CSV creation. I think the way to do it is to serve the user a like "resource unavailable" page that will redirect in a reasonable (500 ms) amount of time.

I suppose I should talk about the data architecture, but I don't think it's that crazy. Besides making sure we have all the required fields (I think we do), I will be sure I'll be changing the layout as we develop this app. 

---

# TODO
- [x] add security fields to openapi
- [x] merge
