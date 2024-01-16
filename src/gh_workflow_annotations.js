const { env } = require("process")

function log_workflow_command(command, value, parameters){
    if(parameters && Object.keys(parameters).length > 0){
        console.log(`::${command} ${Object.entries(parameters).map(([k,v])=>`${k}=${v}`).join(',')}::${value}`)
    } else {
        console.log(`::${command}::${value}`)
    }
}

// translate console error/debug/warn/info commands to error/debug/warning/notice GH workflow commands that create workflow annotations.
if(env.CI === 'true'){
    console.error = (m, ...p) => {
        (p??[]).unshift(m)
        // TODO: stringify object params?
        log_workflow_command('error', p.join(' '))
    }
    console.debug = (m, ...p) => {
        (p??[]).unshift(m)
        // TODO: stringify object params?
        log_workflow_command('debug', p.join(' '))
    }
    console.warn = (m, ...p) => {
        (p??[]).unshift(m)
        // TODO: stringify object params?
        log_workflow_command('warning', p.join(' '))
    }
    console.info = (m, ...p) => {
        (p??[]).unshift(m)
        // TODO: stringify object params?
        log_workflow_command('notice', p.join(' '))
    }
}