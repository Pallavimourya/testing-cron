import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { script } = await request.json()

    // Generate topics based on the script content
    const topics = [
      "My Journey from Childhood Dreams to Professional Success",
      "The Biggest Challenge That Shaped My Career",
      "How I Overcame Failure and Kept Going",
      "The Turning Point That Changed Everything",
      "Lessons from My Greatest Mentor",
      "What Makes My Approach Unique in the Industry",
      "My Proudest Achievement and What It Taught Me",
      "Industry Myths I Challenge and Why",
      "The Most Powerful Lesson from My Journey",
      "My Core Values and How They Guide My Work",
      "The Impact I Want to Create in My Industry",
      "From Small Town to Big Dreams: My Origin Story",
      "When I Almost Gave Up But Didn't",
      "The Key Decision That Changed My Life Path",
      "How I Developed My Most Important Skills",
      "My Breakthrough Moment and What It Meant",
      "The Industry Belief I Disagree With",
      "My Personal Philosophy That Defines Me",
      "Growing Up and Early Influences That Shaped Me",
      "My First Job and the Lessons It Taught Me",
      "Realizing My True Calling in Life",
      "The Moment I Knew What I Wanted to Do",
      "Overcoming the Toughest Challenge of My Life",
      "What Kept Me Going When I Wanted to Quit",
      "The Single Decision That Changed Everything",
      "My Mentor's Greatest Lesson That Still Guides Me",
      "What I Do Today and Who I Help",
      "What Sets Me Apart from Others in My Field",
      "My Greatest Achievement and Why It Matters",
      "The Industry Misconception I Challenge"
    ]

    // Return a subset of topics (you can modify this logic)
    const selectedTopics = topics.slice(0, 15)

    return NextResponse.json({ topics: selectedTopics })
  } catch (error) {
    console.error('Error generating topics:', error)
    return NextResponse.json(
      { error: 'Failed to generate topics' },
      { status: 500 }
    )
  }
}
