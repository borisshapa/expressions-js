## Expressions in Javascript

#### functionalExpression.js
* Функции `cnst`, `variable`, `add`, `subtract`, `multiply`, `divide`, `negate` вычисляют выражения с тремя переменными `x`, `y`, `z`.
    Функции позволяют производить вычисления вида:
    ```
    let expr = subtract(
        multiply(
            cnst(2),
            variable("x")
        ),
        cnst(3)
    );
    println(expr(5));
    ```         
    При вычислении такого выражения вместо каждой переменной подставляется значение, переданное в качестве параметра функции expr. Таким образом, результатом вычисления приведенного примера является число 7.
* Функция `parse` осуществлят разбор выражений, записанных в обратной польской записи. Например, результатом
    ```
    parse("x x 2 - * x * 1 +")(5)
    ```
    является число 76.
*  Также поддерживаются:
      * константы:
          * `pi` — π;
          * `e` — основание натурального логарифма;
      * операции:
          * `avg5` — арифметическое среднее пяти аргументов, `1 2 3 4 5 avg5` равно 7.5;
          * `med3` — медиана трех аргументов, `1 2 -10 med3` равно 1.
          
#### objectExpression.js
* Классы `Const`, `Variable`, `Add`, `Subtract`, `Multiply`, `Divide`, `Negate` представляют выражения с тремя переменными `x`, `y`, `z`.
    Пример описания выражения 2x-3:
    ```
    let expr = new Subtract(
        new Multiply(
            new Const(2),
            new Variable("x")
        ),
        new Const(3)
    );
    ```        
* Метод `evaluate(x)` производит вычисления. При вычислении выражения вместо каждой переменной подставляется значение `x`, переданное в качестве параметра функции `evaluate`.
* Метод `toString()` выдаёт запись выражения в обратной польской записи. Например, `expr.toString()` должен выдавать `2 x * 3 -`.
* Метод `diff("x")` возвращает выражение, представляющее производную исходного выражения по переменной. Например, `expr.diff("x")` возвращает выражение, эквивалентное `new Const(2)`.
* Функция `parse()` выдаёт разобранное объектное выражение.
* Метод `simplify()` производит вычисления константных выражений. Например,
    ```
    parse("x x 2 - * 1 *").diff("x").simplify().toString()
    ```
    возвращает «x x 2 - +».
* Функция `parsePrefix(string)` разбирает выражения, задаваемые записью вида `(- (* 2 x) 3)`. Если разбираемое выражение некорректно, метод `parsePrefix` бросает сообщение об ошибке.
* Метод `prefix()` выдаёт выражение в формате, ожидаемом функцией `parsePrefix`.
* Также поддерживаются функции:
    * `ArcTan` (`atan`) — арктангенс, `1256 atan` примерно равно 1.57;
    * `ArcTan2` (`atan2`) — арктангенс, `841 540 atan2` примерно равно 1;
    * операции произвольного числа аргументов:
        * `Sumexp` (`sumexp`) — сумма экспонент, `(sumexp 8 8 9)` примерно равно 14065;
        * `Softmax` (`softmax`) — softmax первого аргумента, `(softmax 1 2 3)` примерно равно 9;

## Запуск тестов
 * Для запуска тестов используется [GraalVM](https://www.graalvm.org/)
 * Для запуска тестов можно использовать скрипты [TestJS.cmd](javascript/TestJS.cmd) и [TestJS.sh](javascript/TestJS.sh)
    * Репозиторий должен быть скачан целиком.
    * Скрипты должны находиться в главном каталоге (их нельзя перемещать, но можно вызывать из других каталогов).
 * Для самостоятельно запуска из консоли необходимо использовать командную строку вида:
    `java -ea -XX:+UnlockExperimentalVMOptions -XX:+EnableJVMCI --module-path=<js>/graal --upgrade-module-path=<js>/graal/compiler.jar --class-path <js> jstest.functional.FunctionalExpressionTest {hard|easy}`, где
    * `-ea` – включение проверок времени исполнения;
    * `-XX:+UnlockExperimentalVMOptions` и `-XX:+EnableJVMCI` – опции необходимые для запуска Graal;
    * `--module-path=<js>/graal` путь к модулям Graal (здесь и далее `<js>` путь к каталогу `javascript` этого репозитория);
    * `--upgrade-module-path=<js>/graal/compiler.jar` путь к JIT-компилятору Graal;
    * `--class-path <js>` путь к откомпилированным тестам;
    * {`hard`|`easy`} указание тестируемой модификации.
 * При запуске из IDE, обычно не требуется указывать `--class-path`, так как он формируется автоматически.
   Остальные опции все равно необходимо указать.
 * Troubleshooting
    * `Error occurred during initialization of boot layer java.lang.module.FindException: Module org.graalvm.truffle not found, required by jdk.internal.vm.compiler` – неверно указан `--module-path`;
    * `ScriptEngineManager providers.next(): javax.script.ScriptEngineFactory: Provider com.oracle.truffle.js.scriptengine.GraalJSEngineFactory could not be instantiated` – неверно указан `--upgrade-module-path` или не указана опция `-XX:+EnableJVMCI`;
    * `Graal.js not found` – неверно указаны `--module-path` и `--upgrade-module-path`
    * `Error: Could not find or load main class jstest.functional.FunctionalExpressionTest` – неверно указан `--class-path`;
    * `Error: Could not find or load main class <other class>` – неверно указано полное имя класса теста;
    * `Exception in thread "main" java.lang.AssertionError: You should enable assertions by running 'java -ea jstest.functional.FunctionalExpressionTest'` – не указана опция `-ea`;
    * `Error: VM option 'EnableJVMCI' is experimental and must be enabled via -XX:+UnlockExperimentalVMOptions.` – не указана опция `-XX:+UnlockExperimentalVMOptions`;
    * `First argument should be one of: "easy", "hard", found: XXX` – неверно указана сложность;
    * `Exception in thread "main" jstest.EngineException: Script 'functionalExpression.js' not found` – в текущем каталоге отсутствует решение (`functionalExpression.js`)
