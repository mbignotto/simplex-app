import React, { useState, useEffect, useRef } from "react";
import { useSnackbar } from "react-simple-snackbar";
import "./App.css";

function App() {
  const [openSnackbar, closeSnackbar] = useSnackbar({
    position: "top-center",
    style: {
      backgroundColor: "#FF3333",
      color: "white",
    },
  });
  const [numberVars, setNumberVars] = useState(0);
  const [numberConstraints, setNumberConstraints] = useState(0);
  const [firstTime, setFirstTime] = useState(true);

  const [matrix, setMatrix] = useState([]);
  const [historyMatrix, setHistoryMatrix] = useState([]);

  const hasNegativeElement = matrix[0]?.some((value) => value < 0);

  const getError = () => {
    openSnackbar("Simplex inválido", 2000);
    setMatrix([]);
    setHistoryMatrix([]);
  };

  const _renderFoMax = () => {
    let indents = [];
    for (let i = 0; i < numberVars; i++) {
      const textVar = "x" + (i + 1) + (i === numberVars - 1 ? "" : " +");
      indents.push(
        <>
          <input
            type="number"
            onChange={(event) => onChangeVarInFoMax(i, event.target.value)}
          />
          <p>{textVar}</p>
        </>
      );
    }
    return indents;
  };

  const _renderConstraints = () => {
    let constraints = [];

    for (let j = 0; j < numberConstraints; j++) {
      let variables = [];
      constraints.push(
        <div key={j} className="lineInsertVars">
          <p>{`Restrição ${j + 1}: `}</p>
          {variables}
        </div>
      );

      for (let i = 0; i < numberVars; i++) {
        const textboxText = "x" + (i + 1) + (i === numberVars - 1 ? "" : "+");
        variables.push(
          <>
            <input
              type="number"
              onChange={(event) =>
                onChangeVarInRestriction(
                  j,
                  i,
                  event.target.value,
                  false,
                  i === numberVars - 1
                )
              }
            />
            <p>{textboxText}</p>

            {i === numberVars - 1 && (
              <>
                <p>{`<=`}</p>
                <input
                  onChange={(event) =>
                    onChangeVarInRestriction(j, i + 1, event.target.value, true)
                  }
                  type="number"
                />
              </>
            )}
          </>
        );
      }
    }

    return constraints;
  };

  const onChangeVarInFoMax = (column, value) => {
    let copy = [...matrix];
    copy[0][column + 1] = +-value;
    copy[0][0] = 1;

    setMatrix(copy);
  };

  const onChangeVarInRestriction = (
    row,
    column,
    value,
    isColumnB,
    isLastVar
  ) => {
    let copy = [...matrix];

    if (isColumnB) {
      // setar o valor da coluna B
      copy[row + 1][copy[0].length - 1] = +value;
    } else {
      // setar o valor da coluna que nao é B
      copy[row + 1][column + 1] = +value;
    }

    if (isLastVar) {
      // adicionar 1 na variavel de folga
      copy[row + 1][column + +row + 2] = 1;
    }

    //setar Z como 0 em todas as restricoes
    copy[row + 1][0] = 0;

    setMatrix(copy);
  };

  const getColumnIn = (matrix) => {
    try {
      const smallValueInColumn = Math.min(
        ...matrix[0]?.filter((value, index) => value !== 0)
      );

      const indexColumnSmallValue = matrix[0]?.indexOf(smallValueInColumn);

      const columnIn = matrix?.map((row) => row[indexColumnSmallValue]);

      return { columnIn, indexColumnIn: indexColumnSmallValue };
    } catch (e) {
      getError();
    }
  };

  const getColumnOut = (matrix, columnIn, indexColumnIn) => {
    try {
      // separa a ultima coluna
      const lastColumn = matrix?.map((row) => row[row.length - 1]);

      // divide a ultima coluna pela linha IN
      const lastColumnDividedColumIn = lastColumn.map((value, index) => {
        return columnIn[index] > 0 && index !== 0 ? value / columnIn[index] : 0;
      });

      // pega o menor valor da divisao das linhas de restricao para encontrar linha Pivo
      const smallestValue = Math.min(
        ...lastColumnDividedColumIn.filter(
          (value, index) => value > 0 && index > 0
        )
      );

      //encontra a linha out
      const indexRowOut = lastColumnDividedColumIn.findIndex(
        (value, index) => index !== 0 && value === smallestValue
      );

      const rowOut = matrix[indexRowOut];

      const elementPivot = matrix[indexRowOut][indexColumnIn];

      return { rowOut, elementPivot, indexRowOut };
    } catch (e) {
      getError();
    }
  };

  const getNewLine = (matrix, row, indexRow, indexElement, newLinePivot) => {
    try {
      const elementRow = row[indexElement];

      const mutipliedRow = newLinePivot.map(
        (value) => value * (elementRow * -1)
      );

      const newLine = row.map(function (num, idx) {
        return num + mutipliedRow[idx];
      });

      return newLine;
    } catch (e) {
      getError();
    }
  };

  const solveSimplex = () => {
    try {
      if (hasNegativeElement) {
        setMatrix((prev) => {
          let mutableMatrix = [...prev];

          // pega a coluna IN
          const { columnIn, indexColumnIn } = getColumnIn(mutableMatrix);

          //pega a coluna OUT
          const { rowOut, elementPivot, indexRowOut } = getColumnOut(
            mutableMatrix,
            columnIn,
            indexColumnIn
          );

          // calcula a nova linha pivo
          const newLinePivot = rowOut.map((value) => value / elementPivot);

          // coloca a nova linha pivo na tabela
          mutableMatrix[indexRowOut] = newLinePivot;

          mutableMatrix.forEach((row, index) => {
            const columnElement = indexColumnIn;

            if (index !== indexRowOut) {
              const newLine = getNewLine(
                mutableMatrix,
                row,
                index,
                columnElement,
                newLinePivot
              );
              mutableMatrix[index] = newLine;
            }
          });

          return mutableMatrix;
        });
      }
    } catch (e) {
      getError();
    }
    setFirstTime(false);
    setHistoryMatrix((prev) => [...prev, matrix]);
  };

  const _renderTableHeader = () => {
    let teste = [];

    for (let i = 0; i < numberVars; i++) {
      const textVar = "x" + (i + 1);
      teste.push(
        <>
          <th>{textVar}</th>
        </>
      );
    }

    for (let i = 0; i < numberConstraints; i++) {
      const textConstraint = "xf" + (i + 1);

      teste.push(
        <>
          <th>{textConstraint}</th>
        </>
      );
    }

    return teste;
  };

  const _renderTableData = (matrix) => {
    return matrix.map((row) => {
      return (
        <tr>
          {row.map((value) => {
            return (
              <td>{Number.isInteger(value) ? value : value.toFixed(2)}</td>
            );
          })}
        </tr>
      );
    });
  };

  const HeaderAlgoritim = ({ number }) => {
    return (
      <div className="containerHeaderAlgoritim">
        <p>Agoritimo #{number}</p>
      </div>
    );
  };

  useEffect(() => {
    if (numberVars && numberConstraints) {
      const newMatrix = Array.from({ length: +numberConstraints + 1 }, () =>
        Array.from({ length: +numberVars + +numberConstraints + 2 }, () => 0)
      );

      setMatrix(newMatrix);
    }
  }, [numberVars, numberConstraints]);

  return (
    <div className="container">
      <div className="row">
        <div>
          <div className="insertVars">
            <p className="font-bold">Numero de variaveis:</p>
            <input
              type="number"
              onChange={(event) => setNumberVars(event.target.value)}
            />
          </div>
          <div className="insertVars">
            <p className="font-bold">Numero de restricoes:</p>
            <input
              type="number"
              onChange={(event) => setNumberConstraints(event.target.value)}
            />
          </div>
          {numberVars > 0 && numberConstraints > 0 && (
            <>
              <div className="lineInsertVars">
                <p className="font-bold">Maximizar: Z=</p>
                {_renderFoMax()}
              </div>
              <div className="constraints">
                <p className="font-bold">Restrições: </p>
                {_renderConstraints()}
              </div>
            </>
          )}

          {firstTime && numberVars > 0 && numberConstraints > 0 && (
            <div className="containerBtnCalcular">
              <button onClick={() => solveSimplex()}>Calcular</button>
            </div>
          )}
        </div>

        {!hasNegativeElement && matrix.length > 0 && !firstTime && (
          <div className="zvalue">
            <p>RESULTADO FINAL:</p>
            <p>Z = {matrix[0][matrix[0].length - 1].toFixed(2)}</p>
          </div>
        )}
      </div>

      <div className="result">
        {!firstTime && (
          <>
            <p className="font-bold">Solução: </p>

            {historyMatrix.map((matrix, index) => {
              return (
                <>
                  <HeaderAlgoritim number={index + 1} />
                  <table className="flex-table">
                    <thead>
                      <tr>
                        <th>Z</th>
                        {_renderTableHeader()}
                        <th>B</th>
                      </tr>
                    </thead>
                    <tbody>{_renderTableData(matrix)}</tbody>
                  </table>
                </>
              );
            })}

            {!hasNegativeElement && (
              <>
                <HeaderAlgoritim number={historyMatrix.length + 1} />

                <table className="flex-table">
                  <thead>
                    <tr>
                      <th>Z</th>
                      {_renderTableHeader()}
                      <th>B</th>
                    </tr>
                  </thead>
                  <tbody>{_renderTableData(matrix)}</tbody>
                </table>
              </>
            )}
          </>
        )}
      </div>
      {hasNegativeElement && !firstTime && (
        <div className="nextStep">
          <button onClick={() => solveSimplex()}>Próximo passo</button>
        </div>
      )}
    </div>
  );
}

export default App;
