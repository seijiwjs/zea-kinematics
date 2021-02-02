import { createTouchEvents } from './utils'

describe('IkSolver', () => {
  beforeEach(() => {
    cy.visit('testing-e2e/ik-solver.html', {
      onBeforeLoad(win) {
        cy.spy(win, 'postMessage').as('postMessage')
      },
    })
  })

  it('Move handle - Mouse', () => {
    cy.get('#renderer')
      .trigger('mousedown', { button: 0, x: 675, y: 255})
      .trigger('mousemove', { button: 0, x: 675, y: 65})
      .trigger('mousemove', { button: 0, x: 575, y: 65})
      .trigger('mouseup', { button: 0, x: 575, y: 65})
      .percySnapshot('MoveHandleMouse')
  })

  it('Xfo handler - Mouse', () => {
    cy.get('#show-xfo-handler').click()

    cy.get('#renderer')
      .trigger('mousedown', { button: 0, x: 645, y: 260})
      .trigger('mousemove', { button: 0, x: 575, y: 250})
      .trigger('mouseup', { button: 0, x: 575, y: 250})
      .percySnapshot('MoveHandleMouse')
    cy.get('#renderer')
      .trigger('mousedown', { button: 0, x: 585, y: 250})
      .trigger('mousemove', { button: 0, x: 585, y: 270})
      .trigger('mouseup', { button: 0, x: 585, y: 270})
      .percySnapshot('RotateHandlerMouse')
  })
})
