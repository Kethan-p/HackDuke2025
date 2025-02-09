Inspiration
As four avid hikers who all enjoy spending time outdoors, we found that a common issue for local ecosystems is the spread of invasive plant species. In North Carolina, species such as Japanese stiltgrass and kudzu have become particularly problematic. Studies show that local areas invaded by species such as these can experience a 25–40% reduction in native plant diversity. We wanted to create a project that could make a real impact in the fight against harmful plants.

What it does
When hikers see plants they fail to recognize or think may be invasive, they can use the camera identification feature of the platform to identify what species a plant is and see if it is invasive. After invasive plants are flagged, they are marked down on our map interface so that users can see which trails have high densities of invasive species. This crowdsource data is made available to both users and to environmental organizations that can then begin to initiate removal processes. Once invasive plants are removed, they no longer appear on the map of flagged plants.

How we built it
We built a firebase database that stores our user data and plant information. We then created a flask backend that communicates with the database and our API’s (GoogleMaps, Plant.ID, OpenAI) that we used for the plant identification website infrastructure.

Challenges we ran into
Creating a good UI is a lot of work. One of our biggest challenges was getting the camera feature to work correctly and to get the website up and running. Early on, we had two different forms of page routing going on in the website at once and this was challenging to debug because we had to completely change the structure of our pages code.

Accomplishments that we're proud of
We are very proud of how well we worked together as a team in this competition setting and how we partitioned different workflow features. We did a good job having distinct branches and we avoided disruptive merge conflicts that some of our team members have run into during past hackathons.

What we learned
the value of time
hosting is hard
a strong backend makes for a strong frontend
communication of ideas
division of labor
What's next for Petal Path
We would like to create mobile app for users and work on cleaning up the code. Eventually, we would like to partner with environmental organizations or even government offices like the EPA to make our crowdsource invasive plants data available for large scale removal efforts.

Built With
firebase
flask
google-cloud
google-maps
react

