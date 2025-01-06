const { appendFileSync, rmSync, existsSync } = require("fs");
const { join } = require("path");
const { env } = require("process");

const logPath = join(__dirname, "..", "pages", "_includes", "run.log");

if (existsSync(logPath)) rmSync(logPath);

function log_workflow_command(command, value, parameters) {
    if (parameters && Object.keys(parameters).length > 0) {
        console.log(
            `::${command} ${Object.entries(parameters)
                .map(([k, v]) => `${k}=${v}`)
                .join(",")}::${value}`
        );
    } else {
        console.log(`::${command}::${value}`);
    }
}

function writeToLogFile(text, classname = "debug") {
    appendFileSync(logPath, `<div class="${classname}">${text}</div>\n`);
}

// translate console error/debug/warn/info commands to error/debug/warning/notice GH workflow commands that create workflow annotations.
if (env.CI === "true") {
    console.error = (m, ...p) => {
        (p ?? []).unshift(m);
        // TODO: stringify object params?
        log_workflow_command("error", p.join(" "));
        writeToLogFile(p.join(" "), "error");
    };
    console.debug = (m, ...p) => {
        (p ?? []).unshift(m);
        // TODO: stringify object params?
        log_workflow_command("debug", p.join(" "));
        writeToLogFile(p.join(" "), "debug");
    };
    console.warn = (m, ...p) => {
        (p ?? []).unshift(m);
        // TODO: stringify object params?
        log_workflow_command("warning", p.join(" "));
        writeToLogFile(p.join(" "), "warning");
    };
    console.info = (m, ...p) => {
        (p ?? []).unshift(m);
        // TODO: stringify object params?
        log_workflow_command("notice", p.join(" "));
        writeToLogFile(p.join(" "), "notice");
    };
} else {
    console.error = (m, ...p) => {
        (p ?? []).unshift(m);
        // TODO: stringify object params?
        console.log(...p);
        writeToLogFile(p.join(" "), "error");
    };
    console.debug = (m, ...p) => {
        (p ?? []).unshift(m);
        // TODO: stringify object params?
        console.log(...p);
        writeToLogFile(p.join(" "), "debug");
    };
    console.warn = (m, ...p) => {
        (p ?? []).unshift(m);
        // TODO: stringify object params?
        console.log(...p);
        writeToLogFile(p.join(" "), "warning");
    };
    console.info = (m, ...p) => {
        (p ?? []).unshift(m);
        // TODO: stringify object params?
        console.log(...p);
        writeToLogFile(p.join(" "), "notice");
    };
}
