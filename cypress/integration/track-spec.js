describe('Track', () => {
  beforeEach(() => {
    cy.visit('testing-e2e/track.html', {
      onBeforeLoad(win) {
        cy.spy(win, 'postMessage').as('postMessage')
      },
    })
  })

  it('Move Timeline', () => {
    cy.get('#timeline')
      .click(0, 0)
      .percySnapshot('MoveTimeline1')
    cy.get('#timeline')
      .click(200, 0)
      .percySnapshot('MoveTimeline2')
      cy.get('#timeline')
      .click(400, 0)
      .percySnapshot('MoveTimeline3')
      cy.get('#timeline')
      .click(600, 0)
      .percySnapshot('MoveTimeline4')
      cy.get('#timeline')
      .click(800, 0)
      .percySnapshot('MoveTimeline5')
  })

  it.only('Move Timeline', () => {
    cy.get('#timeline')
      .click(0, 0)
      .percySnapshot('MoveTimelineBtn1')
    cy.get('#nextkey')
      .click()
      .percySnapshot('MoveTimelineBtn2')
    cy.get('#nextkey')
      .click()
      .percySnapshot('MoveTimelineBtn3')
    cy.get('#nextkey')
      .click()
      .percySnapshot('MoveTimelineBtn4')
    cy.get('#nextkey')
      .click()
      .percySnapshot('MoveTimelineBtn5')
  })
})
