# Hosting your Gigapixel through Amazon Web Services

Before you can begin this process, you wil need to have generated Zoomify images. You can learn more about how to make one [here](https://storymap.knightlab.com/gigapixel/).

Note: While Amazon supports free web hosting through its Free Tier option, after a year, you will have to pay to use their hosting services. It's relatively cheap (~$.03 / month for 1 GB, using their [pricing calculator](https://calculator.s3.amazonaws.com/index.html), but if you want an entirely free option, you can check out our GitHub hosting tutorial.

1. Sign up to create an account on [Amazon Web Services](https://aws.amazon.com/). If prompted, choose the 'Basic' account setting.
![](1.png)
2. Once your account has been created, choose the [quickstart web hosting option](https://console.aws.amazon.com/quickstart-website/new) on your dashboard.
![](2.png)
3. On your computer, navigate to the folder where you've stored your Gigapixel tiles. Inside the directory, create an empty file called 'index.html.'
![](3.png)
4. Compress your Gigapixel image folder.
![](4.png)
5. Now, go back to the quickstart web hosting page, and upload your compressed folder.
![](5.png)
6. Amazon will spend ~15 minutes to publish your Gigapixel to their servers, but once Amazon is done, they will provide you a link to your hosted webpage.
![](6.png)

You're done! Use the [Storymap authoring tool](https://storymap.knightlab.com/select/) to create your Gigapixel and include the link to your Amazon webpage.

![](7.png)
