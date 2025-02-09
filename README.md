# Petal Path

## Inspiration
As four avid hikers who all enjoy spending time outdoors, we found that a common issue for local ecosystems is the spread of invasive plant species. In North Carolina, species such as Japanese stiltgrass and kudzu have become particularly problematic. Studies show that local areas invaded by species such as these can experience a 25–40% reduction in native plant diversity. We wanted to create a project that could make a real impact in the fight against harmful plants.

## What It Does
When hikers see plants they fail to recognize or think may be invasive, they can use the camera identification feature of the platform to determine the species and check if it is invasive. Once flagged, invasive plants are marked on our map interface so users can see which trails have high densities of these species. This crowdsourced data is available to both users and environmental organizations, which can then initiate removal processes. After invasive plants are removed, they no longer appear on the map.

## How We Built It
- **Database:** We built a Firebase database that stores our user data and plant information.
- **Backend:** A Flask backend was created to communicate with the database and our APIs.
- **APIs & Integrations:** We integrated with several APIs including Google Maps, Plant.ID, and OpenAI to support the plant identification feature and overall website infrastructure.

## Challenges We Ran Into
Creating a polished UI was a significant challenge. One of our biggest hurdles was getting the camera feature to work correctly and ensuring the website was up and running smoothly. Initially, we had two different forms of page routing occurring simultaneously, which made debugging difficult and forced us to restructure our page code completely.

## Accomplishments We're Proud Of
- **Team Collaboration:** We worked exceptionally well together in a competitive setting, effectively partitioning workflow features.
- **Version Control:** We maintained distinct branches and avoided disruptive merge conflicts, a challenge some of our team members faced in previous hackathons.

## What We Learned
- The value of time
- Hosting is hard
- A strong backend makes for a strong frontend
- Communication of ideas
- Division of labor

## What's Next for Petal Path
- **Mobile App:** We plan to create a mobile app for users.
- **Code Cleanup:** We aim to clean up and optimize the codebase.
- **Partnerships:** Our long-term goal is to partner with environmental organizations or government agencies (like the EPA) to leverage our crowdsourced invasive plant data for large-scale removal efforts.

## Built With
- Firebase
- Flask
- Google Cloud
- Google Maps
- React

