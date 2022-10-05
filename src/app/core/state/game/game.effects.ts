import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concat, concatAll, of, switchMap } from 'rxjs';
import { BoardService } from '../../services/board/board.service';
import { clearValue, detectedIncorrectAnswer, gameComplete, loadNewGame, setBoard, setValue, startNewGame } from './game.actions';
import { selectActiveFieldCell, selectGameBoard } from './game.selectors';

@Injectable()
export class GameEffects {
  setValue$ = createEffect(() =>
    this.actions$.pipe(
      ofType(setValue),
      concatLatestFrom(() => [this.store.select(selectGameBoard), this.store.select(selectActiveFieldCell)]),
      switchMap(([{ value }, board, activeFieldCell]) => {
        const updatedBoard = this.boardService.setCellValue(value, board, activeFieldCell);
        const wrongAnswer = activeFieldCell && activeFieldCell?.answer !== value && activeFieldCell?.value !== value;
        const complete = this.boardService.isComplete(updatedBoard);

        return concat([
          setBoard({ board: updatedBoard }),
          ...(wrongAnswer ? [detectedIncorrectAnswer()] : []),
          ...(complete ? [gameComplete()] : []),
        ]);
      }),
    ),
  );
  clearValue$ = createEffect(() =>
    this.actions$.pipe(
      ofType(clearValue),
      concatLatestFrom(() => [this.store.select(selectGameBoard), this.store.select(selectActiveFieldCell)]),
      switchMap(([{}, board, activeFieldCell]) => of(setBoard({ board: this.boardService.clearCellValue(board, activeFieldCell) }))),
    ),
  );
  startNewGame$ = createEffect(() =>
    this.actions$.pipe(
      ofType(startNewGame),
      switchMap(({ difficulty }) =>
        of(
          loadNewGame({
            difficulty,
            board: this.boardService.generateBoard(difficulty),
          }),
        ),
      ),
    ),
  );

  constructor(private store: Store, private actions$: Actions, private boardService: BoardService) {}
}
